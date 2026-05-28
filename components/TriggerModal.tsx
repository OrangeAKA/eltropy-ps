"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Mic,
  MicOff,
  MessageSquare,
  Phone,
  Send,
  Keyboard,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { triggers } from "@/data/triggers";
import { members } from "@/data/members";
import { cn } from "@/lib/utils";
import type { TriggerChannel } from "@/lib/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: (payload: {
    channel: TriggerChannel;
    fromPhone: string;
    body: string;
  }) => void;
};

// ────────────────────────────────────────────────────────────────────────────
// Minimal Web Speech API typings (browser globals not in default lib.dom)
// ────────────────────────────────────────────────────────────────────────────

type SpeechRecognitionEvent = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
};

type ISpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionCtor = new () => ISpeechRecognition;

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

// ────────────────────────────────────────────────────────────────────────────

export function TriggerModal({ open, onOpenChange, onSend }: Props) {
  const [selectedMemberId, setSelectedMemberId] = useState<string>(members[0].id);
  const [body, setBody] = useState<string>("");
  const [channel, setChannel] = useState<TriggerChannel>("sms");
  const [isRecording, setIsRecording] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  // Detect Web Speech support on mount
  useEffect(() => {
    if (open) {
      const SpeechRecognitionCtor = getSpeechRecognition();
      setSpeechSupported(Boolean(SpeechRecognitionCtor));
    }
    if (!open) {
      // Stop any in-flight recording when modal closes
      stopRecording();
      setSpeechError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const selectedMember = members.find((m) => m.id === selectedMemberId)!;
  const matchingTrigger = triggers.find(
    (t) => t.fromPhone === selectedMember.phone,
  );

  function loadPreset() {
    if (matchingTrigger) {
      setBody(matchingTrigger.body);
      setChannel(matchingTrigger.channel);
    }
  }

  function startRecording() {
    const SpeechRecognitionCtor = getSpeechRecognition();
    if (!SpeechRecognitionCtor) {
      setSpeechError("Web Speech API not supported in this browser. Use Chrome or Edge.");
      return;
    }

    setSpeechError(null);
    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalTranscript = "";

    recognition.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      setBody(finalTranscript + interim);
    };

    recognition.onerror = (e) => {
      setSpeechError(`Speech recognition error: ${e.error}`);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsRecording(true);
      setChannel("voice");
    } catch {
      setSpeechError("Could not start recording. Check microphone permissions.");
    }
  }

  function stopRecording() {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsRecording(false);
  }

  function handleSend() {
    if (!body.trim()) return;
    stopRecording();
    onSend({
      channel,
      fromPhone: selectedMember.phone,
      body: body.trim(),
    });
    onOpenChange(false);
    // Reset for next time
    setTimeout(() => {
      setBody("");
      setChannel("sms");
    }, 400);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-base">
            Send a member trigger to Mission Control
          </DialogTitle>
          <DialogDescription className="text-xs">
            Pick a member, then send their message. Speak, paste a preset, or type.
          </DialogDescription>
        </DialogHeader>

        {/* Member picker */}
        <section>
          <Label>Member (resolves by phone)</Label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            {members.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedMemberId(m.id)}
                className={cn(
                  "text-left p-2 border rounded-md transition",
                  selectedMemberId === m.id
                    ? "border-blue-500 bg-blue-50/50"
                    : "border-neutral-200 hover:border-neutral-400",
                )}
              >
                <div className="text-sm font-medium leading-tight">
                  {m.fullName}
                </div>
                <div className="text-[10px] text-neutral-500 font-mono">
                  {m.phone} · FICO {m.fico} · {m.memberTier}
                </div>
              </button>
            ))}
          </div>
        </section>

        <Separator />

        {/* Message input modes */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Message body</Label>
            <div className="flex gap-1">
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] gap-1",
                  channel === "sms" && "border-blue-300 text-blue-700",
                  channel === "voice" && "border-emerald-300 text-emerald-700",
                )}
              >
                {channel === "voice" ? (
                  <Phone className="h-2.5 w-2.5" />
                ) : (
                  <MessageSquare className="h-2.5 w-2.5" />
                )}
                {channel}
              </Badge>
            </div>
          </div>

          <Textarea
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              if (isRecording) stopRecording();
            }}
            placeholder="What is the member saying? Speak below, paste a preset, or type here."
            rows={4}
            className="text-sm"
          />

          {/* Action row */}
          <div className="flex flex-wrap gap-1.5">
            {speechSupported && (
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                variant={isRecording ? "destructive" : "outline"}
                size="sm"
                className="gap-1.5 h-8"
              >
                <AnimatePresence mode="wait">
                  {isRecording ? (
                    <motion.span
                      key="rec"
                      className="flex items-center gap-1.5"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <motion.span
                        className="h-2 w-2 rounded-full bg-white"
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                      Stop recording
                    </motion.span>
                  ) : (
                    <motion.span
                      key="mic"
                      className="flex items-center gap-1.5"
                    >
                      <Mic className="h-3.5 w-3.5" />
                      Speak as {selectedMember.fullName.split(" ")[0]}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            )}

            {matchingTrigger && (
              <Button
                onClick={loadPreset}
                variant="outline"
                size="sm"
                className="gap-1.5 h-8"
              >
                <Keyboard className="h-3.5 w-3.5" />
                Use preset {matchingTrigger.channel}
              </Button>
            )}
          </div>

          {!speechSupported && (
            <div className="text-[11px] text-neutral-500 flex items-start gap-1.5">
              <MicOff className="h-3 w-3 mt-0.5 shrink-0" />
              <span>
                Voice input requires Chrome or Edge. Paste a preset or type
                instead.
              </span>
            </div>
          )}

          {speechError && (
            <div className="text-[11px] text-rose-700 flex items-start gap-1.5 bg-rose-50 border border-rose-200 rounded p-2">
              <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
              <span>{speechError}</span>
            </div>
          )}

          <div className="text-[10px] text-neutral-500 leading-snug">
            <strong>Suggestions:</strong>{" "}
            {selectedMember.fullName === "Michael Tanaka"
              ? "\"I need a $25,000 auto loan for a 2024 Honda CR-V.\""
              : "\"I'd like to refinance my auto loan, balance is around $18K at 7.49%.\""}
          </div>
        </section>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={!body.trim()}
            size="sm"
            className="gap-1.5"
          >
            <Send className="h-3.5 w-3.5" />
            Send to Mission Control
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] uppercase tracking-wide text-neutral-600 font-medium">
      {children}
    </div>
  );
}

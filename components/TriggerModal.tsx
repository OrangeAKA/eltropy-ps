"use client";

import { useRef, useState } from "react";
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
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const speechSupported = Boolean(getSpeechRecognition());

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
    handleOpenChange(false);
    setBody("");
    setChannel("sms");
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      stopRecording();
      setSpeechError(null);
    }
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl border border-rule-strong bg-[color:color-mix(in_oklch,var(--color-surface-card)_94%,white)]">
        <DialogHeader>
          <DialogTitle className="text-base font-serif tracking-[-0.01em]">
            Send a member trigger to Mission Control
          </DialogTitle>
          <DialogDescription className="text-xs leading-relaxed">
            Pick a member and route their message into the demo. Voice, preset,
            and manual entry all hit the same ingestion path.
          </DialogDescription>
        </DialogHeader>

        {/* Member picker */}
        <section className="space-y-2">
          <Label>Member (resolves by phone)</Label>
          <p className="text-[11px] leading-relaxed text-neutral-500">
            The resolver will match the trigger on{" "}
            <span className="font-mono tabular-nums text-neutral-700">
              {selectedMember.phone}
            </span>{" "}
            before the workflow routes.
          </p>
          <div className="grid grid-cols-2 gap-2 mt-1">
            {members.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedMemberId(m.id)}
                aria-pressed={selectedMemberId === m.id}
                className={cn(
                  "rounded-lg border p-2 text-left transition-[border-color,background-color,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-out-quart)]",
                  selectedMemberId === m.id
                    ? "border-brand-300 bg-brand-50/75 shadow-[inset_0_0_0_1px_rgba(14,124,123,0.12)]"
                    : "border-rule bg-white hover:border-brand-200",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-medium leading-tight">
                      {m.fullName}
                    </div>
                    <div className="text-[10px] text-neutral-500 font-mono">
                      {m.phone}
                    </div>
                  </div>
                  {selectedMemberId === m.id && (
                    <Badge className="bg-brand-50 text-brand-700 text-[9px]">
                      Selected
                    </Badge>
                  )}
                </div>
                <div className="mt-1 text-[10px] text-neutral-500">
                  FICO <span className="font-mono">{m.fico}</span> ·{" "}
                  {m.memberTier}
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
                  "gap-1 text-[10px]",
                  channel === "sms" && "border-brand-200 bg-brand-50 text-brand-700",
                  channel === "voice" && "border-amber-200 bg-amber-50 text-amber-800",
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

          {isRecording && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-2.5 py-2 text-[11px] leading-relaxed text-amber-900">
              Listening live. Speech will transcribe into the message field until
              you stop recording or start typing.
            </div>
          )}

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

        <div className="flex justify-end gap-2 border-t border-rule pt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenChange(false)}
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
            Start workflow
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

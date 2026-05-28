"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ConversationMessage, TriggerChannel } from "@/lib/types";
import { Phone, MessageSquare, MessageCircle, ArrowUpRight } from "lucide-react";

type Props = {
  messages: ConversationMessage[];
  channel?: TriggerChannel;
};

export function ConversationThread({ messages, channel }: Props) {
  const endRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    endRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "end",
    });
  }, [messages, reduceMotion]);

  if (messages.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-brand-200 bg-brand-50">
          <MessageSquare className="h-5 w-5 text-brand-600" />
        </div>
        <p className="mb-1 font-serif text-lg font-medium tracking-[-0.02em] text-neutral-800">
          Waiting for an inbound member
        </p>
        <p className="max-w-[300px] text-xs leading-relaxed text-neutral-500">
          Send a trigger from the header to simulate voice, SMS, or chat. The
          member will resolve first, then the officer response path will fill in
          from right to left across this workspace.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-rule bg-[color:color-mix(in_oklch,var(--color-brand-50)_28%,white)] px-3 py-2">
        <div className="flex items-center gap-1.5 text-xs text-neutral-600">
          {channelIcon(channel)}
          <span className="font-medium">
            {channel === "voice"
              ? "Voice call"
              : channel === "sms"
                ? "SMS conversation"
                : channel === "chat"
                  ? "Web chat"
                  : "Conversation"}
          </span>
        </div>
        <span className="text-[10px] text-neutral-500 font-mono">
          {messages.length} messages
        </span>
      </div>

      <div className="flex-1 overflow-y-auto bg-[color:color-mix(in_oklch,var(--color-surface-card)_80%,white)] p-3 space-y-2">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24, ease: [0.25, 1, 0.5, 1] }}
              className={cn(
                "flex",
                msg.sender === "member" && "justify-start",
                msg.sender === "officer" && "justify-end",
                msg.sender === "system" && "justify-center",
              )}
            >
              <div
                className={cn(
                  "max-w-[82%] rounded-2xl px-3 py-2 text-sm",
                  msg.sender === "member" &&
                    "rounded-bl-sm border border-rule bg-white text-neutral-900",
                  msg.sender === "officer" &&
                    "rounded-br-sm bg-brand-700 text-white",
                  msg.sender === "system" &&
                    "max-w-full rounded-xl border border-brand-200 bg-brand-50/75 text-xs text-brand-900",
                )}
              >
                {msg.sender !== "system" && (
                  <div className="mb-0.5 flex items-center justify-between gap-3">
                    <div
                      className={cn(
                        "text-[10px] font-medium",
                        msg.sender === "member" && "text-neutral-500",
                        msg.sender === "officer" && "text-brand-100",
                      )}
                    >
                      {msg.sender === "member" ? "Member" : "Sarah Chen"}
                    </div>
                    <div
                      className={cn(
                        "text-[10px] font-mono tabular-nums",
                        msg.sender === "member" && "text-neutral-400",
                        msg.sender === "officer" && "text-brand-100/80",
                      )}
                    >
                      {formatMessageTime(msg.timestamp)}
                    </div>
                  </div>
                )}
                {msg.sender === "system" && (
                  <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-brand-700">
                    <ArrowUpRight className="h-3 w-3" />
                    Workflow outcome
                  </div>
                )}
                <div className="leading-snug whitespace-pre-wrap">{msg.text}</div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={endRef} />
      </div>
    </div>
  );
}

function channelIcon(channel?: TriggerChannel) {
  if (channel === "voice") return <Phone className="h-3.5 w-3.5" />;
  if (channel === "sms") return <MessageSquare className="h-3.5 w-3.5" />;
  return <MessageCircle className="h-3.5 w-3.5" />;
}

function formatMessageTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

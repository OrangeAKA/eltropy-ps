"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ConversationMessage, TriggerChannel } from "@/lib/types";
import { Phone, MessageSquare, MessageCircle } from "lucide-react";

type Props = {
  messages: ConversationMessage[];
  channel?: TriggerChannel;
};

export function ConversationThread({ messages, channel }: Props) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center mb-3">
          <MessageSquare className="h-5 w-5 text-blue-600" />
        </div>
        <p className="text-sm font-medium text-neutral-800 mb-1">
          Waiting for an inbound member
        </p>
        <p className="text-xs text-neutral-500 leading-snug max-w-[260px]">
          Click <span className="font-medium text-neutral-700">Send trigger</span> in the
          header to simulate a call, SMS, or chat. The orchestrator will resolve
          the member, route the workflow, and surface a recommended next step.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-neutral-200 bg-neutral-50/50 flex items-center justify-between">
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

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={cn(
                "flex",
                msg.sender === "member" && "justify-start",
                msg.sender === "officer" && "justify-end",
                msg.sender === "system" && "justify-center",
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                  msg.sender === "member" &&
                    "bg-neutral-100 text-neutral-900 rounded-bl-sm",
                  msg.sender === "officer" &&
                    "bg-blue-600 text-white rounded-br-sm",
                  msg.sender === "system" &&
                    "bg-emerald-50 text-emerald-800 text-xs border border-emerald-200",
                )}
              >
                {msg.sender !== "system" && (
                  <div
                    className={cn(
                      "text-[10px] mb-0.5 font-medium",
                      msg.sender === "member" && "text-neutral-500",
                      msg.sender === "officer" && "text-blue-100",
                    )}
                  >
                    {msg.sender === "member" ? "Member" : "Sarah Chen"}
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

"use client";

import { useEffect, useRef } from "react";
import { AuditLogEntry } from "@/components/shared/AuditLogEntry";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AuditLogEntry as AuditLogEntryType } from "@/lib/types";
import { Terminal } from "lucide-react";

type Props = {
  log: AuditLogEntryType[];
};

export function RuntimeTab({ log }: Props) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom on new log entries
    const viewport = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]",
    ) as HTMLDivElement | null;
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [log]);

  if (log.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-neutral-400 p-8">
        <Terminal className="h-8 w-8 mb-2 opacity-50" />
        <p className="text-sm">Runtime audit log</p>
        <p className="text-xs mt-1 text-center max-w-xs">
          Streams here when a trigger fires. Every skill execution, guardrail
          decision, and tool call is recorded.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea ref={scrollAreaRef} className="h-full bg-neutral-50">
      <div className="p-2 space-y-0">
        {log.map((entry) => (
          <AuditLogEntry key={entry.id} entry={entry} />
        ))}
      </div>
    </ScrollArea>
  );
}

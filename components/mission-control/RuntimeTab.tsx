"use client";

import { useEffect, useRef } from "react";
import { AuditLogEntry } from "@/components/shared/AuditLogEntry";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AuditLogEntry as AuditLogEntryType } from "@/lib/types";
import { RuntimeGlyph } from "@/components/shared/TabIcons";

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
        <RuntimeGlyph className="h-8 w-8 mb-2 opacity-50" />
        <p className="font-serif text-base text-neutral-700">Runtime audit log</p>
        <p className="text-xs mt-1 text-center max-w-xs leading-relaxed">
          Streams here when a trigger fires. Every skill execution, guardrail
          decision, and tool call is recorded.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea ref={scrollAreaRef} className="h-full bg-[color:color-mix(in_oklch,var(--color-brand-50)_24%,white)]">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-rule bg-[color:color-mix(in_oklch,var(--color-surface-card)_90%,white)] px-3 py-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">
            Immutable audit stream
          </p>
          <p className="text-xs text-neutral-700">
            Every transition is logged with component ownership and elapsed time.
          </p>
        </div>
        <span className="rounded-full border border-rule px-2 py-0.5 text-[10px] font-mono text-neutral-600">
          {log.length} events
        </span>
      </div>
      <div className="p-2 space-y-1">
        {log.map((entry) => (
          <AuditLogEntry key={entry.id} entry={entry} />
        ))}
      </div>
    </ScrollArea>
  );
}

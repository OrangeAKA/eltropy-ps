"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { AuditLogEntry as AuditLogEntryType } from "@/lib/types";

type Props = { entry: AuditLogEntryType };

const LEVEL_COLOR: Record<AuditLogEntryType["level"], string> = {
  INFO: "text-slate-700",
  DEBUG: "text-neutral-500",
  WARN: "text-amber-700",
  ERROR: "text-rose-700",
};

const LEVEL_BG: Record<AuditLogEntryType["level"], string> = {
  INFO: "bg-slate-100",
  DEBUG: "bg-neutral-100",
  WARN: "bg-amber-50",
  ERROR: "bg-rose-50",
};

const LEVEL_DOT: Record<AuditLogEntryType["level"], string> = {
  INFO: "bg-slate-400",
  DEBUG: "bg-neutral-300",
  WARN: "bg-amber-500",
  ERROR: "bg-rose-500",
};

export function AuditLogEntry({ entry }: Props) {
  // Format elapsed time as MM:SS.mmm
  const elapsedFmt = formatElapsed(entry.elapsedMs);

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "rounded-lg border border-transparent bg-[color:color-mix(in_oklch,var(--color-surface-card)_90%,white)] px-2.5 py-2 font-mono text-[11px] leading-snug transition-colors duration-[var(--duration-fast)] hover:border-rule hover:bg-white",
      )}
    >
      <div className="flex items-baseline gap-2">
        <span className="text-neutral-400 tabular-nums">{elapsedFmt}</span>
        <span
          className={cn(
            "px-1 rounded text-[9px] font-bold tracking-wide",
            LEVEL_COLOR[entry.level],
            LEVEL_BG[entry.level],
          )}
        >
          {entry.level.padEnd(5)}
        </span>
        <span className={cn("mt-px h-1.5 w-1.5 shrink-0 rounded-full", LEVEL_DOT[entry.level])} />
        <span className="rounded-full bg-neutral-100 px-1.5 py-px text-[10px] text-neutral-500">
          {entry.component}
        </span>
        <span className="text-neutral-700 break-all whitespace-pre-wrap">
          {entry.message}
        </span>
      </div>
    </motion.div>
  );
}

function formatElapsed(ms: number): string {
  const totalSec = ms / 1000;
  const min = Math.floor(totalSec / 60);
  const sec = Math.floor(totalSec % 60);
  const millis = Math.floor(ms % 1000);
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
}

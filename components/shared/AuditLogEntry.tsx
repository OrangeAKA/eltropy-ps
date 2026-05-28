"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { AuditLogEntry as AuditLogEntryType } from "@/lib/types";

type Props = { entry: AuditLogEntryType };

const LEVEL_COLOR: Record<AuditLogEntryType["level"], string> = {
  INFO: "text-emerald-700",
  DEBUG: "text-neutral-500",
  WARN: "text-amber-700",
  ERROR: "text-rose-700",
};

const LEVEL_BG: Record<AuditLogEntryType["level"], string> = {
  INFO: "bg-emerald-50",
  DEBUG: "bg-neutral-100",
  WARN: "bg-amber-50",
  ERROR: "bg-rose-50",
};

export function AuditLogEntry({ entry }: Props) {
  // Format elapsed time as MM:SS.mmm
  const elapsedFmt = formatElapsed(entry.elapsedMs);

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="font-mono text-[11px] leading-snug py-1 px-2 hover:bg-neutral-100 rounded"
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

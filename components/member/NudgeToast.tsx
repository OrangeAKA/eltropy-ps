"use client";

import { useEffect, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface NudgeToastProps {
  visible: boolean;
  onAction: () => void;
  onDismiss: () => void;
}

// Guided directorial nudge. Appears in Member view when the system has
// started doing visible work and the viewer should switch to Mission
// Control to watch the processing live. Clicking the toast switches
// perspective; clicking dismiss collapses it without switching.
//
// Visual treatment: floating chip near the bottom of the viewport, soft
// elevation, animated entrance via translateY. Subtle, not alarming —
// it's a suggestion, not a warning.
export function NudgeToast({ visible, onAction, onDismiss }: NudgeToastProps) {
  // Tiny delay before mount so the toast appears AFTER the call connect
  // beat, not on top of it. Feels more like a directorial choice than
  // a popup that fires the instant state changes.
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (!visible) {
      setShown(false);
      return;
    }
    const t = window.setTimeout(() => setShown(true), 350);
    return () => window.clearTimeout(t);
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-40",
        "flex items-center gap-2",
        "rounded-2xl border border-rule bg-[color:var(--color-surface-card)]",
        "pl-4 pr-2 py-2.5",
        "shadow-[0_18px_36px_-18px_color-mix(in_oklch,var(--color-brand-900)_28%,transparent)]",
        "transition-all duration-[var(--duration-medium)] ease-[var(--ease-out-quint)]",
        shown
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-3 pointer-events-none",
      )}
      role="status"
      aria-live="polite"
    >
      <button
        type="button"
        onClick={onAction}
        className="flex items-center gap-2 text-left"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-50 text-brand-700">
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.2} />
        </span>
        <span className="flex flex-col leading-tight">
          <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Tip
          </span>
          <span className="text-[13px] font-medium text-foreground">
            Switch to Mission Control to watch the system process this live
          </span>
        </span>
      </button>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss tip"
        className="ml-2 inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-rule hover:text-foreground transition-colors"
      >
        <X className="h-3.5 w-3.5" strokeWidth={2} />
      </button>
    </div>
  );
}

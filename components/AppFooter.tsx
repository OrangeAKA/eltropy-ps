"use client";

import { useEffect, useState } from "react";
import { Info } from "lucide-react";

export function AppFooter() {
  const [time, setTime] = useState<string>("--:--:--");

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setTime(d.toLocaleTimeString("en-US", { hour12: false }));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="sticky bottom-0 z-20 flex shrink-0 items-center justify-between border-t border-rule bg-[color:color-mix(in_oklch,var(--color-surface-card)_84%,white)] px-4 py-2 text-[10px] text-neutral-500 backdrop-blur-md">
      <div className="flex min-w-0 items-start gap-1.5">
        <Info className="mt-0.5 h-3 w-3 shrink-0 text-brand-700" />
        <span className="max-w-[96ch] leading-relaxed">
          Synthetic data prototype for the Eltropy FDPM evaluation. Voice
          transcription uses the browser&apos;s Web Speech engine in Chrome or
          Edge; production would swap to a CFI-compliant STT provider.
        </span>
      </div>
      <div className="ml-4 shrink-0 rounded-full border border-rule bg-white/70 px-2 py-1 font-mono tabular-nums text-neutral-600">
        {time}
      </div>
    </footer>
  );
}

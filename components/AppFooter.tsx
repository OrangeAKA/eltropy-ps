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
    <footer className="border-t border-neutral-200 bg-white px-4 py-1.5 flex items-center justify-between text-[10px] text-neutral-500 shrink-0">
      <div className="flex items-center gap-1.5">
        <Info className="h-3 w-3" />
        <span>
          Synthetic data prototype, built for the Eltropy FDPM evaluation.
          Voice transcription uses your browser&apos;s built-in Web Speech engine
          (Chrome or Edge recommended). In production, Eltropy would use a
          CFI-compliant STT provider.
        </span>
      </div>
      <div className="font-mono tabular-nums shrink-0 ml-4">{time}</div>
    </footer>
  );
}

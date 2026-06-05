"use client";

import { Signal, Wifi, BatteryFull } from "lucide-react";

interface PhoneFrameProps {
  children?: React.ReactNode;
}

// iPhone-shaped chrome for the member surface. Width caps at 412px to
// match iPhone 14 Pro reference; height fills the column with an inner
// scroll area so long content doesn't push the device frame off-screen.
//
// The bezel uses a near-black warm color in the brand hue family so it
// never reads as plastic. Subtle drop shadow on the device matches
// member-side decoration rules (member surface allows soft elevation;
// cockpit surface does not).
export function PhoneFrame({ children }: PhoneFrameProps) {
  return (
    <div className="h-full w-full flex items-start justify-center overflow-y-auto px-3 py-5">
      <div
        className="relative w-full max-w-[412px] rounded-[44px] p-[10px]"
        style={{
          background: "oklch(0.18 0.01 195)",
          boxShadow:
            "0 24px 60px -24px color-mix(in oklch, var(--color-brand-900) 22%, transparent), 0 1px 2px rgba(0,0,0,0.04)",
        }}
      >
        {/* Inner screen */}
        <div
          className="relative w-full overflow-hidden rounded-[36px] aspect-[9/19.5]"
          style={{ background: "var(--color-member-bg)" }}
        >
          {/* Status bar */}
          <div className="relative z-10 flex items-center justify-between px-7 pt-3 pb-2 text-[12px] font-medium text-foreground">
            <span className="font-mono tabular-nums">9:41</span>
            <span
              className="absolute left-1/2 top-1.5 h-6 w-24 -translate-x-1/2 rounded-full"
              style={{ background: "oklch(0.18 0.01 195)" }}
              aria-hidden
            />
            <div className="flex items-center gap-1.5">
              <Signal className="h-3 w-3" strokeWidth={2.5} />
              <Wifi className="h-3 w-3" strokeWidth={2.5} />
              <BatteryFull className="h-3.5 w-3.5" strokeWidth={2.5} />
            </div>
          </div>

          {/* App content area */}
          <div className="px-5 pb-10">{children}</div>

          {/* Home indicator */}
          <div
            className="absolute bottom-1.5 left-1/2 h-1 w-32 -translate-x-1/2 rounded-full opacity-30"
            style={{ background: "var(--foreground)" }}
            aria-hidden
          />
        </div>
      </div>
    </div>
  );
}

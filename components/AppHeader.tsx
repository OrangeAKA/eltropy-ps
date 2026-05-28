"use client";

import { Button } from "@/components/ui/button";
import { Play, RotateCcw } from "lucide-react";
import { EltropyMark } from "@/components/shared/EltropyMark";
import { VendorMonogram } from "@/components/shared/VendorMonogram";

type Props = {
  onTriggerClick: () => void;
  onReset: () => void;
  isActive: boolean;
  pristine?: boolean;
};

const SYSTEMS: Array<{
  name: string;
  vendor: "symitar" | "meridianlink" | "velera" | "eltropy";
  status: "connected";
}> = [
  { name: "Symitar", vendor: "symitar", status: "connected" },
  { name: "MeridianLink", vendor: "meridianlink", status: "connected" },
  { name: "Velera", vendor: "velera", status: "connected" },
  { name: "Eltropy Voice", vendor: "eltropy", status: "connected" },
];

export function AppHeader({ onTriggerClick, onReset, isActive, pristine }: Props) {
  return (
    <header className="border-b border-neutral-200 bg-white px-4 py-2.5 flex items-center gap-4 shrink-0">
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="h-8 w-8 rounded-md bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center shadow-[0_2px_8px_rgba(14,124,123,0.35)]">
          <EltropyMark className="h-[18px] w-[18px] text-white" />
        </div>
        <div className="leading-tight">
          <div className="text-[15px] font-semibold tracking-tight">
            Mission Control
          </div>
          <div className="text-[10px] text-neutral-500">
            Eltropy &middot; Cyprus Credit Union
          </div>
        </div>
      </div>

      <div className="hidden lg:flex items-center gap-2 ml-6">
        <span className="text-[10px] uppercase tracking-wide text-neutral-400 font-medium">
          Integrations
        </span>
        <div className="flex items-center gap-1.5">
          {SYSTEMS.map((s) => (
            <div
              key={s.name}
              className="flex items-center gap-1.5 pl-1 pr-2 py-0.5 rounded-full bg-neutral-50 border border-neutral-200/70"
              title={`${s.name} · connected`}
            >
              <VendorMonogram
                vendor={s.vendor}
                className="h-3.5 w-3.5 text-[8px]"
              />
              <span className="text-[10px] text-neutral-700 font-medium">
                {s.name}
              </span>
              <span
                className="h-1.5 w-1.5 rounded-full bg-emerald-500"
                aria-label="connected"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto shrink-0">
        <Button
          onClick={onReset}
          variant="ghost"
          size="sm"
          className="gap-1.5 h-8 text-neutral-500"
          disabled={!isActive}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </Button>
        {pristine && (
          <span className="hidden xl:inline text-[11px] text-brand-700 font-medium animate-pulse">
            Start here &rarr;
          </span>
        )}
        <div className="relative">
          {pristine && (
            <>
              <span
                aria-hidden
                className="pointer-events-none absolute -inset-1 rounded-lg ring-2 ring-brand-400 opacity-60 animate-ping"
              />
              <span
                aria-hidden
                className="pointer-events-none absolute -inset-0.5 rounded-md ring-2 ring-brand-400/70"
              />
            </>
          )}
          <Button
            onClick={onTriggerClick}
            size="sm"
            className="relative gap-1.5 h-8 bg-brand-600 hover:bg-brand-700 shadow-sm"
          >
            <Play className="h-3.5 w-3.5" />
            Send trigger
          </Button>
        </div>
      </div>
    </header>
  );
}

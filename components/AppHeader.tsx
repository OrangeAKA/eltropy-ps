"use client";

import { Button } from "@/components/ui/button";
import { Play, RotateCcw, Zap } from "lucide-react";

type Props = {
  onTriggerClick: () => void;
  onReset: () => void;
  isActive: boolean;
  pristine?: boolean;
};

const SYSTEMS = [
  { name: "Symitar", status: "connected" as const },
  { name: "MeridianLink", status: "connected" as const },
  { name: "Velera", status: "connected" as const },
  { name: "Eltropy Voice", status: "connected" as const },
];

export function AppHeader({ onTriggerClick, onReset, isActive, pristine }: Props) {
  return (
    <header className="border-b border-neutral-200 bg-white px-4 py-2.5 flex items-center gap-4 shrink-0">
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="h-7 w-7 rounded-md bg-blue-600 flex items-center justify-center shadow-sm">
          <Zap className="h-4 w-4 text-white" />
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
        <div className="flex items-center gap-1">
          {SYSTEMS.map((s) => (
            <div
              key={s.name}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-50 border border-neutral-200/70"
              title={`${s.name} · connected`}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              <span className="text-[10px] text-neutral-600">{s.name}</span>
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
          <span className="hidden xl:inline text-[11px] text-blue-700 font-medium animate-pulse">
            Start here &rarr;
          </span>
        )}
        <div className="relative">
          {pristine && (
            <>
              <span
                aria-hidden
                className="pointer-events-none absolute -inset-1 rounded-lg ring-2 ring-blue-400 opacity-60 animate-ping"
              />
              <span
                aria-hidden
                className="pointer-events-none absolute -inset-0.5 rounded-md ring-2 ring-blue-400/70"
              />
            </>
          )}
          <Button
            onClick={onTriggerClick}
            size="sm"
            className="relative gap-1.5 h-8 bg-blue-600 hover:bg-blue-700 shadow-sm"
          >
            <Play className="h-3.5 w-3.5" />
            Send trigger
          </Button>
        </div>
      </div>
    </header>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { Play, RotateCcw, Zap } from "lucide-react";

type Props = {
  onTriggerClick: () => void;
  onReset: () => void;
  isActive: boolean;
};

const SYSTEMS = [
  { name: "Symitar SymXchange", status: "connected" as const },
  { name: "MeridianLink Consumer", status: "connected" as const },
  { name: "Velera", status: "connected" as const },
  { name: "Eltropy Voice AI", status: "connected" as const },
];

export function AppHeader({ onTriggerClick, onReset, isActive }: Props) {
  return (
    <header className="border-b border-neutral-200 bg-white px-4 py-2.5 flex items-center gap-4 shrink-0">
      <div className="flex items-center gap-2 shrink-0">
        <div className="h-6 w-6 rounded bg-blue-600 flex items-center justify-center">
          <Zap className="h-3.5 w-3.5 text-white" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold">
            Eltropy Mission Control
          </div>
          <div className="text-[10px] text-neutral-500">
            Cyprus Credit Union · Production
          </div>
        </div>
      </div>

      <div className="hidden lg:flex items-center gap-3 flex-1 justify-center">
        {SYSTEMS.map((s) => (
          <div key={s.name} className="flex items-center gap-1.5 text-[10px]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            <span className="text-neutral-600 font-mono">{s.name}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 ml-auto shrink-0">
        <Button
          onClick={onReset}
          variant="ghost"
          size="sm"
          className="gap-1.5 h-8"
          disabled={!isActive}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </Button>
        <Button onClick={onTriggerClick} size="sm" className="gap-1.5 h-8">
          <Play className="h-3.5 w-3.5" />
          Send trigger
        </Button>
      </div>
    </header>
  );
}

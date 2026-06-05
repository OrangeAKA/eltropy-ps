"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, RotateCcw } from "lucide-react";
import { EltropyMark } from "@/components/shared/EltropyMark";
import { VendorMonogram } from "@/components/shared/VendorMonogram";
import { ArchitectureDialog } from "@/components/ArchitectureDialog";
import { cn } from "@/lib/utils";

export type Perspective = "member" | "cockpit";

type Props = {
  perspective: Perspective;
  onPerspectiveChange: (next: Perspective) => void;
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

/**
 * Small custom glyph for the "How it works" button. Two interlocking arrows
 * suggest the orchestrator's translation step: free text in, structured out.
 */
function ArchitectureGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <circle cx="6" cy="6" r="2" />
      <circle cx="18" cy="6" r="2" />
      <circle cx="12" cy="18" r="2" />
      <path d="M8 7 L11 16" />
      <path d="M16 7 L13 16" />
      <path d="M7 5 L17 5" strokeDasharray="2 2" />
    </svg>
  );
}

/**
 * Compact Cyprus CU brand mark. Member-side header signal that this is the
 * credit union surface, not the Eltropy cockpit.
 */
function CyprusMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex items-center justify-center font-mono text-[10px] font-semibold tracking-[0.04em]",
        className,
      )}
    >
      CCU
    </span>
  );
}

function PerspectivePill({
  perspective,
  onChange,
}: {
  perspective: Perspective;
  onChange: (next: Perspective) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Perspective"
      className="inline-flex items-center rounded-full border border-rule bg-[color:color-mix(in_oklch,var(--color-surface-card)_92%,white)] p-0.5"
    >
      <button
        type="button"
        role="tab"
        aria-selected={perspective === "member"}
        onClick={() => onChange("member")}
        className={cn(
          "rounded-full px-3 py-1 text-[11px] font-medium tracking-[0.02em]",
          "transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out-quart)]",
          perspective === "member"
            ? "bg-brand-700 text-white shadow-[0_1px_0_color-mix(in_oklch,var(--color-brand-900)_24%,transparent)]"
            : "text-neutral-600 hover:text-neutral-900",
        )}
      >
        Member view
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={perspective === "cockpit"}
        onClick={() => onChange("cockpit")}
        className={cn(
          "rounded-full px-3 py-1 text-[11px] font-medium tracking-[0.02em]",
          "transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out-quart)]",
          perspective === "cockpit"
            ? "bg-brand-700 text-white shadow-[0_1px_0_color-mix(in_oklch,var(--color-brand-900)_24%,transparent)]"
            : "text-neutral-600 hover:text-neutral-900",
        )}
      >
        Mission Control
      </button>
    </div>
  );
}

export function AppHeader({
  perspective,
  onPerspectiveChange,
  onTriggerClick,
  onReset,
  isActive,
  pristine,
}: Props) {
  const [archOpen, setArchOpen] = useState(false);
  const isMember = perspective === "member";

  return (
    <header className="border-b border-rule-strong bg-[color:color-mix(in_oklch,var(--color-surface-card)_92%,white)] px-4 py-3 flex items-center gap-4 shrink-0">
      {/* Brand (swaps based on perspective) */}
      <div className="flex items-center gap-3 shrink-0">
        {isMember ? (
          <>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[color:var(--color-member-rule)] bg-[color:color-mix(in_oklch,var(--color-brand-50)_64%,white)]">
              <CyprusMark className="text-brand-800" />
            </div>
            <div className="leading-tight">
              <div className="font-serif text-[18px] font-medium tracking-[-0.015em] text-neutral-900">
                Cyprus Credit Union
              </div>
              <div className="text-[10px] text-neutral-500 tracking-[0.16em] uppercase">
                Member portal
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand-200 bg-brand-50/90">
              <EltropyMark className="h-[18px] w-[18px] text-brand-700" />
            </div>
            <div className="leading-tight">
              <div className="font-serif text-[18px] font-medium tracking-[-0.015em] text-neutral-900">
                Mission Control
              </div>
              <div className="text-[10px] text-neutral-500 tracking-[0.16em] uppercase">
                Eltropy &middot; Cyprus Credit Union
              </div>
            </div>
          </>
        )}
      </div>

      {/* Integrations row — cockpit mode only */}
      {!isMember && (
        <div className="hidden xl:flex items-center gap-2 ml-6">
          <span className="text-[10px] uppercase tracking-[0.16em] text-neutral-400 font-medium">
            Integrations
          </span>
          <div className="flex items-center gap-1.5">
            {SYSTEMS.map((s) => (
              <div
                key={s.name}
                className="flex items-center gap-1.5 rounded-full border border-rule bg-[color:color-mix(in_oklch,var(--color-brand-50)_48%,white)] pl-1 pr-2 py-0.5 transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out-quart)] hover:border-brand-200"
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
                  className="h-1.5 w-1.5 rounded-full bg-brand-500"
                  aria-label="connected"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Perspective toggle — center-aligned via ml-auto on the left group
          and the actions taking ml-auto on the right. We push the toggle
          to mx-auto for visual centering across both modes. */}
      <div className="mx-auto">
        <PerspectivePill
          perspective={perspective}
          onChange={onPerspectiveChange}
        />
      </div>

      {/* Right-side actions */}
      <div className="flex items-center gap-2 shrink-0">
        <Button
          onClick={() => setArchOpen(true)}
          variant="ghost"
          size="sm"
          className="gap-1.5 h-8 text-neutral-600 hover:text-brand-700"
        >
          <ArchitectureGlyph className="h-3.5 w-3.5" />
          How it works
        </Button>
        <ArchitectureDialog open={archOpen} onOpenChange={setArchOpen} />

        {/* Cockpit-only dev affordances */}
        {!isMember && (
          <>
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
              <span className="hidden xl:inline rounded-full border border-brand-200 bg-brand-50 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-brand-800">
                Start with a trigger
              </span>
            )}
            <div className="relative">
              {pristine && (
                <>
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -inset-1 rounded-lg border border-brand-300/80 motion-safe:animate-pulse"
                  />
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -inset-0.5 rounded-md border border-brand-400/60"
                  />
                </>
              )}
              <Button
                onClick={onTriggerClick}
                size="sm"
                className="relative h-8 gap-1.5 bg-brand-600 hover:bg-brand-700"
              >
                <Play className="h-3.5 w-3.5" />
                Send trigger
              </Button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}

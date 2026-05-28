"use client";

import { Fragment } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { EltropyMark } from "@/components/shared/EltropyMark";
import { Sliders, UserCheck } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const TRACE_STEPS: Array<{
  kind: "input" | "llm" | "rules" | "human" | "action";
  label: string;
  detail: string;
}> = [
  { kind: "input", label: "Member message", detail: '"$25K auto loan"' },
  { kind: "llm", label: "LLM", detail: "intent + entities" },
  { kind: "rules", label: "Router", detail: "workflow select" },
  { kind: "rules", label: "Guardrails", detail: "per-step policy" },
  { kind: "human", label: "Officer", detail: "confirm / modify" },
  { kind: "action", label: "Action", detail: "e-sign / file" },
];

export function ArchitectureDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(96vw,1180px)] max-w-none gap-0 p-0 bg-card border border-rule-strong shadow-[0_28px_60px_-12px_rgba(8,79,78,0.18),0_8px_24px_-8px_rgba(8,79,78,0.12)] rounded-xl overflow-hidden">
        {/* Masthead */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-rule bg-[color:color-mix(in_oklch,var(--color-brand-50)_42%,white)]">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-brand-200 bg-card">
              <EltropyMark className="h-4 w-4 text-brand-700" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="font-serif text-[20px] font-medium tracking-[-0.015em] leading-tight">
                How this works
              </DialogTitle>
              <DialogDescription className="mt-1 text-[12px] leading-snug text-neutral-600 max-w-[68ch]">
                LLM translates. Rules decide. Officer signs off. Three lanes,
                one trigger; the boundaries are the design.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Three lanes, always 3-column at the dialog's intended width */}
          <div className="grid grid-cols-3 gap-3">
            <LaneCard
              icon={<EltropyMark className="h-3.5 w-3.5 text-brand-700" />}
              label="LLM"
              caption="Claude Haiku 4.5"
              tone="brand"
              points={[
                "Free text in, typed JSON out",
                "Picks one intent + extracts entities",
                "Self-reports a confidence score",
              ]}
              boundary="Doesn't approve, decline, or escalate. Translates only."
            />
            <LaneCard
              icon={<Sliders className="h-3.5 w-3.5 text-slate-700" />}
              label="Rules engine"
              caption="Deterministic, versioned"
              tone="slate"
              points={[
                "FICO bands, DTI / LTV ceilings, cross-sell",
                "Reg E 10-day clock, $50 cap, $2.5K threshold",
                "GLBA + per-step consent guardrails",
              ]}
              boundary="Every decline cites a named rule. Same inputs, same outputs."
            />
            <LaneCard
              icon={<UserCheck className="h-3.5 w-3.5 text-amber-700" />}
              label="Human in loop"
              caption="Officer signs off"
              tone="amber"
              points={[
                "Reviews the offer before e-sign dispatches",
                "Confirms a dispute before Velera filing",
                "Can modify or cancel at any gate",
              ]}
              boundary="Every outbound action carries an officer signature. LLM cannot bypass."
            />
          </div>

          {/* Flow trace: single horizontal row of 6 chips, with arrows */}
          <div className="rounded-md border border-rule bg-surface-page px-4 py-3">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-[10px] uppercase tracking-[0.12em] text-neutral-500 font-medium">
                One trigger, traced
              </span>
              <span className="text-[10px] text-neutral-500">
                Every stage streams to the Runtime audit log.
              </span>
            </div>
            <div className="flex items-stretch gap-1">
              {TRACE_STEPS.map((step, idx) => (
                <Fragment key={`${step.label}-${idx}`}>
                  <FlowStep stepNumber={idx + 1} step={step} />
                  {idx < TRACE_STEPS.length - 1 && <FlowArrow />}
                </Fragment>
              ))}
            </div>
          </div>

          {/* Two notes inline */}
          <div className="grid grid-cols-2 gap-3">
            <NoteCard
              title="If the LLM goes down"
              body="Keyword classifier in lib/orchestrator/intent-classifier.ts takes over. The rules engine consumes structured output regardless of source. LLM is rented; rules are owned."
              accent="brand"
            />
            <NoteCard
              title="Why it stays auditable"
              body="Every decline cites a specific rule. Every outbound action has an officer signature. Every event is logged. ECOA, Reg E, GLBA, NCUA Part 748 each have a named place in the rules layer."
              accent="slate"
            />
          </div>
        </div>

        {/* Source footer */}
        <div className="px-6 py-3 border-t border-rule bg-[color:color-mix(in_oklch,var(--color-surface-page)_70%,white)]">
          <p className="text-[10px] text-neutral-500 leading-snug">
            Source:{" "}
            <span className="font-mono tabular-nums text-neutral-700">
              lib/orchestrator/
            </span>
            ,{" "}
            <span className="font-mono tabular-nums text-neutral-700">
              lib/skills/
            </span>
            ,{" "}
            <span className="font-mono tabular-nums text-neutral-700">
              lib/guardrails/
            </span>
            . Each file owns exactly one lane.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LaneCard({
  icon,
  label,
  caption,
  tone,
  points,
  boundary,
}: {
  icon: React.ReactNode;
  label: string;
  caption: string;
  tone: "brand" | "slate" | "amber";
  points: string[];
  boundary: string;
}) {
  const toneClass =
    tone === "brand"
      ? "border-brand-200 bg-[color:color-mix(in_oklch,var(--color-brand-50)_55%,white)]"
      : tone === "slate"
        ? "border-slate-200 bg-slate-50/70"
        : "border-amber-200 bg-amber-50/60";
  return (
    <div className={`rounded-md border p-3 ${toneClass} flex flex-col`}>
      <div className="flex items-center gap-1.5 mb-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-card border border-rule shrink-0">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[12px] font-semibold leading-tight">{label}</div>
          <div className="text-[10px] text-neutral-500 leading-tight font-mono tabular-nums">
            {caption}
          </div>
        </div>
      </div>
      <ul className="space-y-1 flex-1">
        {points.map((p, i) => (
          <li
            key={i}
            className="flex gap-1.5 text-[11px] leading-snug text-neutral-700"
          >
            <span className="text-neutral-400 shrink-0 select-none">·</span>
            <span>{p}</span>
          </li>
        ))}
      </ul>
      <div className="mt-2.5 pt-2 border-t border-rule text-[10px] leading-snug text-neutral-600">
        {boundary}
      </div>
    </div>
  );
}

function FlowStep({
  stepNumber,
  step,
}: {
  stepNumber: number;
  step: { kind: "input" | "llm" | "rules" | "human" | "action"; label: string; detail: string };
}) {
  const tone: Record<typeof step.kind, string> = {
    input: "border-rule bg-card",
    llm: "border-brand-300 bg-[color:color-mix(in_oklch,var(--color-brand-50)_60%,white)]",
    rules: "border-slate-300 bg-slate-50",
    human: "border-amber-300 bg-amber-50",
    action: "border-emerald-300 bg-emerald-50",
  };
  const dot: Record<typeof step.kind, string> = {
    input: "bg-neutral-400",
    llm: "bg-brand-500",
    rules: "bg-slate-500",
    human: "bg-amber-500",
    action: "bg-emerald-500",
  };
  return (
    <div
      className={`flex-1 min-w-0 border rounded-md px-2 py-1.5 ${tone[step.kind]}`}
    >
      <div className="flex items-center gap-1 mb-0.5">
        <span className="font-mono tabular-nums text-[9px] text-neutral-400">
          {String(stepNumber).padStart(2, "0")}
        </span>
        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dot[step.kind]}`} />
        <span className="text-[11px] font-semibold text-neutral-800 truncate">
          {step.label}
        </span>
      </div>
      <div className="text-[10px] text-neutral-600 leading-snug truncate">
        {step.detail}
      </div>
    </div>
  );
}

function FlowArrow() {
  return (
    <div
      className="flex items-center text-neutral-400 shrink-0 px-0.5"
      aria-hidden
    >
      <svg
        viewBox="0 0 12 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-3 w-3"
      >
        <path d="M2 6 L10 6" />
        <path d="M7 3 L10 6 L7 9" />
      </svg>
    </div>
  );
}

function NoteCard({
  title,
  body,
  accent,
}: {
  title: string;
  body: string;
  accent: "brand" | "slate";
}) {
  const c =
    accent === "brand"
      ? "border-brand-200 bg-[color:color-mix(in_oklch,var(--color-brand-50)_40%,white)]"
      : "border-slate-200 bg-slate-50/70";
  return (
    <div className={`rounded-md border p-3 ${c}`}>
      <div className="text-[12px] font-semibold text-neutral-900 mb-1">
        {title}
      </div>
      <p className="text-[11px] text-neutral-700 leading-snug">{body}</p>
    </div>
  );
}

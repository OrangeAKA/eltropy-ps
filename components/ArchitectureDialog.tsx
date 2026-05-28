"use client";

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

export function ArchitectureDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader className="pb-1">
          <DialogTitle className="text-base flex items-center gap-2">
            <EltropyMark className="h-4 w-4 text-brand-600" />
            How this works
          </DialogTitle>
          <DialogDescription className="text-xs leading-snug">
            What the LLM is doing, what the rules engine is doing, and where the officer signs off.
          </DialogDescription>
        </DialogHeader>

        {/* The split: three responsibility lanes */}
        <div className="grid grid-cols-3 gap-2">
          <LaneCard
            icon={<EltropyMark className="h-3.5 w-3.5 text-brand-600" />}
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
            boundary="Every decline cites a named rule. Same inputs → same outputs."
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

        {/* Flow trace: single row, 6 cells */}
        <div className="border border-neutral-200 rounded-md bg-neutral-50/60 p-2.5">
          <div className="text-[9px] uppercase tracking-wide text-neutral-500 font-semibold mb-1.5">
            One trigger, traced
          </div>
          <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr_auto_1fr_auto_1fr] gap-1 items-stretch">
            <FlowStep kind="input" label="Member msg" detail='"$25K auto loan"' />
            <Arrow />
            <FlowStep kind="llm" label="LLM" detail="intent + entities" />
            <Arrow />
            <FlowStep kind="rules" label="Router" detail="→ workflow" />
            <Arrow />
            <FlowStep kind="rules" label="Guardrails" detail="per step" />
            <Arrow />
            <FlowStep kind="human" label="Officer" detail="confirm / modify" />
            <Arrow />
            <FlowStep kind="action" label="Action" detail="e-sign / file" />
          </div>
          <div className="mt-1.5 text-[10px] text-neutral-600 leading-snug">
            Every event between stages streams to the Runtime tab. The audit log is the contract.
          </div>
        </div>

        {/* Two side-by-side notes */}
        <div className="grid grid-cols-2 gap-2">
          <NoteCard
            title="If the LLM goes down"
            body="Keyword classifier in lib/orchestrator/intent-classifier.ts takes over. The rules engine consumes structured output regardless of source. LLM is rented; rules are owned."
            accent="brand"
          />
          <NoteCard
            title="Why it stays auditable"
            body="Every decline cites a specific rule. Every outbound action has an officer signature. Every event is logged. ECOA, Reg E, GLBA, NCUA Part 748 each have a named place in the rules layer, not a vibe in a prompt."
            accent="slate"
          />
        </div>

        {/* Footer pointer */}
        <div className="pt-2 border-t border-neutral-200 text-[10px] text-neutral-500 leading-snug">
          Source: <span className="font-mono">lib/orchestrator/</span>, <span className="font-mono">lib/skills/</span>, <span className="font-mono">lib/guardrails/</span>. Each file owns exactly one lane. The boundaries are the design.
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
      ? "border-brand-200 bg-brand-50/40"
      : tone === "slate"
        ? "border-slate-200 bg-slate-50/60"
        : "border-amber-200 bg-amber-50/40";
  return (
    <div className={`rounded-md border p-2.5 ${toneClass}`}>
      <div className="flex items-center gap-1.5 mb-1.5">
        {icon}
        <div className="min-w-0">
          <div className="text-xs font-semibold leading-tight truncate">
            {label}
          </div>
          <div className="text-[10px] text-neutral-500 leading-tight truncate">
            {caption}
          </div>
        </div>
      </div>
      <ul className="space-y-0.5">
        {points.map((p, i) => (
          <li
            key={i}
            className="text-[11px] text-neutral-700 leading-snug flex gap-1"
          >
            <span className="text-neutral-400 shrink-0">·</span>
            <span>{p}</span>
          </li>
        ))}
      </ul>
      <div className="text-[10px] text-neutral-500 italic leading-snug mt-1.5 pt-1.5 border-t border-neutral-200/70">
        {boundary}
      </div>
    </div>
  );
}

function FlowStep({
  kind,
  label,
  detail,
}: {
  kind: "input" | "llm" | "rules" | "human" | "action";
  label: string;
  detail: string;
}) {
  const tone: Record<typeof kind, string> = {
    input: "border-neutral-300 bg-white",
    llm: "border-brand-300 bg-brand-50",
    rules: "border-slate-300 bg-slate-50",
    human: "border-amber-300 bg-amber-50",
    action: "border-emerald-300 bg-emerald-50",
  };
  const dot: Record<typeof kind, string> = {
    input: "bg-neutral-400",
    llm: "bg-brand-500",
    rules: "bg-slate-500",
    human: "bg-amber-500",
    action: "bg-emerald-500",
  };
  return (
    <div className={`border rounded px-1.5 py-1 ${tone[kind]} min-w-0`}>
      <div className="flex items-center gap-1 mb-0.5">
        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dot[kind]}`} />
        <span className="text-[10px] font-semibold text-neutral-800 truncate">
          {label}
        </span>
      </div>
      <div className="text-[9px] text-neutral-600 leading-snug truncate">
        {detail}
      </div>
    </div>
  );
}

function Arrow() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-3 w-3 text-neutral-400"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12 L19 12" />
      <path d="M13 6 L19 12 L13 18" />
    </svg>
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
      ? "border-brand-200 bg-brand-50/30"
      : "border-slate-200 bg-slate-50/60";
  return (
    <div className={`rounded-md border p-2.5 ${c}`}>
      <div className="text-xs font-semibold text-neutral-900 mb-1">
        {title}
      </div>
      <p className="text-[11px] text-neutral-700 leading-snug">{body}</p>
    </div>
  );
}

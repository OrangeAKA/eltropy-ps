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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <EltropyMark className="h-4 w-4 text-brand-600" />
            How this works
          </DialogTitle>
          <DialogDescription className="text-sm leading-snug">
            What the LLM is doing, what the rules engine is doing, and where
            the officer signs off. The split is the point.
          </DialogDescription>
        </DialogHeader>

        {/* The split: three responsibility lanes */}
        <section className="mt-2">
          <div className="text-[10px] uppercase tracking-wide text-neutral-500 font-semibold mb-2">
            The split
          </div>
          <div className="grid grid-cols-3 gap-2">
            <LaneCard
              icon={<EltropyMark className="h-4 w-4 text-brand-600" />}
              label="LLM"
              caption="Claude Haiku 4.5"
              tone="brand"
              points={[
                "Free text in, typed JSON out",
                "Picks one intent from a fixed set",
                "Extracts amount, merchant, vehicle, etc.",
                "Self-reports a confidence score",
              ]}
              boundary="Doesn't approve, decline, or escalate. Only translates."
            />
            <LaneCard
              icon={<Sliders className="h-4 w-4 text-slate-700" />}
              label="Rules engine"
              caption="Deterministic, versioned"
              tone="slate"
              points={[
                "FICO bands, DTI ceiling, LTV ceiling, cross-sell",
                "Reg E 10-day window, $50 liability cap, $2,500 provisional credit threshold",
                "GLBA disclosure preconditions",
                "Per-step guardrails: consent, confidence, scope",
              ]}
              boundary="Every decline points at a named rule. Same inputs always produce the same outputs."
            />
            <LaneCard
              icon={<UserCheck className="h-4 w-4 text-amber-700" />}
              label="Human in loop"
              caption="Officer signs off"
              tone="amber"
              points={[
                "Reviews the offer before e-sign dispatches",
                "Confirms the disputed transaction before Velera filing",
                "Can modify or cancel at any gate",
                "Identity step-up if confidence drops",
              ]}
              boundary="Every outbound action carries an officer signature. The LLM cannot bypass."
            />
          </div>
        </section>

        {/* Flow trace */}
        <section className="mt-5">
          <div className="text-[10px] uppercase tracking-wide text-neutral-500 font-semibold mb-2">
            One trigger, traced
          </div>
          <div className="border border-neutral-200 rounded-md bg-neutral-50/60 p-3">
            <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] gap-2 items-center text-[11px]">
              <FlowStep
                kind="input"
                label="Member message"
                detail='"I need a $25K auto loan"'
              />
              <Arrow />
              <FlowStep
                kind="llm"
                label="LLM classifies"
                detail="intent + entities + confidence"
              />
              <Arrow />
              <FlowStep
                kind="rules"
                label="Router picks workflow"
                detail="intent → workflow ID"
              />
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] gap-2 items-center text-[11px] mt-2">
              <FlowStep
                kind="rules"
                label="Guardrails per step"
                detail="consent, scope, thresholds"
              />
              <Arrow />
              <FlowStep
                kind="human"
                label="Officer reviews"
                detail="confirm / modify"
              />
              <Arrow />
              <FlowStep
                kind="action"
                label="Action fires"
                detail="e-sign / dispute / disclosure"
              />
            </div>
            <div className="mt-3 pt-2 border-t border-neutral-200 text-[10px] text-neutral-600 leading-snug">
              Every event between these stages lands in the Runtime tab. The
              audit log is the contract, not a side effect.
            </div>
          </div>
        </section>

        {/* Two side-by-side notes */}
        <section className="mt-5 grid grid-cols-2 gap-3">
          <NoteCard
            title="If the LLM goes down"
            body="A keyword classifier in lib/orchestrator/intent-classifier.ts takes over. The rules engine consumes structured output regardless of who produced it, so the demo and a production deploy both keep running. The LLM is rented; the rules are owned."
            accent="brand"
          />
          <NoteCard
            title="Why it stays auditable"
            body="Every decline cites a specific rule. Every outbound action carries an officer signature. Every event is logged with timing and component. ECOA, Reg E, GLBA, NCUA Part 748: each has a named place in the rules layer, not a vibe in a prompt."
            accent="slate"
          />
        </section>

        {/* Footer pointer */}
        <div className="mt-4 pt-3 border-t border-neutral-200 text-[10px] text-neutral-500 leading-snug">
          Source:{" "}
          <span className="font-mono">lib/orchestrator/</span>,{" "}
          <span className="font-mono">lib/skills/</span>,{" "}
          <span className="font-mono">lib/guardrails/</span>. Each file owns
          exactly one of the three lanes above; the boundaries are the design.
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
    <div className={`rounded-md border p-3 ${toneClass}`}>
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <div>
          <div className="text-xs font-semibold leading-tight">{label}</div>
          <div className="text-[10px] text-neutral-500 leading-tight">
            {caption}
          </div>
        </div>
      </div>
      <ul className="space-y-1 mt-2">
        {points.map((p, i) => (
          <li
            key={i}
            className="text-[11px] text-neutral-700 leading-snug flex gap-1.5"
          >
            <span className="text-neutral-400 shrink-0">·</span>
            <span>{p}</span>
          </li>
        ))}
      </ul>
      <div className="text-[10px] text-neutral-500 italic leading-snug mt-2 pt-2 border-t border-neutral-200/70">
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
    <div className={`border rounded p-2 ${tone[kind]}`}>
      <div className="flex items-center gap-1 mb-0.5">
        <span className={`h-1.5 w-1.5 rounded-full ${dot[kind]}`} />
        <span className="text-[10px] font-semibold text-neutral-800">
          {label}
        </span>
      </div>
      <div className="text-[10px] text-neutral-600 leading-snug">{detail}</div>
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
    <div className={`rounded-md border p-3 ${c}`}>
      <div className="text-xs font-semibold text-neutral-900 mb-1">
        {title}
      </div>
      <p className="text-[11px] text-neutral-700 leading-snug">{body}</p>
    </div>
  );
}

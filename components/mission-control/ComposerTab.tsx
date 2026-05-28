"use client";

import { skills } from "@/data/skills";
import { workflows } from "@/data/workflows";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { SkillExecutionResult } from "@/lib/types";

type Props = {
  activeSkillId?: string;
  completedSkillIds: string[];
  workflowId?: string;
  skillResults?: Record<string, SkillExecutionResult>;
};

export function ComposerTab({
  activeSkillId,
  completedSkillIds,
  workflowId,
  skillResults,
}: Props) {
  const workflow =
    workflows.find((w) => w.id === workflowId) ??
    workflows.find((w) => w.name === "OneCallLending") ??
    workflows[0];

  const isRunning = Boolean(activeSkillId);
  const completedCount = workflow.steps.filter((s) =>
    completedSkillIds.includes(s.skillId),
  ).length;
  const currentStepIndex = workflow.steps.findIndex(
    (s) => s.skillId === activeSkillId,
  );

  return (
    <ScrollArea className="h-full">
      <div className="p-4">
        <div className="mb-3">
          <div className="flex items-baseline gap-2 mb-1">
            <h3 className="font-serif text-[20px] font-medium tracking-[-0.01em]">
              {workflow.displayName ?? workflow.name}
            </h3>
            <span
              className="font-mono tabular-nums text-[10px] text-neutral-400"
              title={`Workflow ID: ${workflow.id}`}
            >
              {workflow.id}
            </span>
          </div>
          <p className="max-w-[62ch] text-xs text-neutral-600 leading-relaxed">
            {workflow.description}
          </p>
          <div className="flex flex-wrap items-center gap-1 mt-2">
            <span className="text-[10px] uppercase tracking-[0.12em] text-neutral-500">
              Triggers on
            </span>
            {workflow.triggerIntents.map((i) => (
              <Badge key={i} variant="secondary" className="font-mono tabular-nums text-[10px]">
                {i}
              </Badge>
            ))}
          </div>
        </div>

        {isRunning && (
          <StatusStrip
            workflowName={workflow.displayName ?? workflow.name}
            currentStep={currentStepIndex + 1}
            totalSteps={workflow.steps.length}
            completedCount={completedCount}
          />
        )}

        <div className={cn("border-t border-neutral-200", isRunning ? "pt-2" : "pt-3")}>
          <div className="space-y-0">
            {workflow.steps.map((step, idx) => {
              const skill = skills.find((s) => s.id === step.skillId);
              if (!skill) return null;

              const state: "idle" | "running" | "completed" =
                completedSkillIds.includes(step.skillId)
                  ? "completed"
                  : activeSkillId === step.skillId
                    ? "running"
                    : "idle";

              const result = skillResults?.[step.skillId];
              const durationMs = result?.durationMs;

              return (
                <div key={`${step.skillId}-${idx}`}>
                  <WorkflowNode
                    index={idx + 1}
                    name={step.displayName ?? skill.name}
                    state={state}
                    humanInTheLoop={step.humanInTheLoop}
                    guardrailCondition={step.guardrails.condition}
                    autoExecute={step.guardrails.autoExecute}
                    durationMs={state === "completed" ? durationMs : undefined}
                  />
                  {idx < workflow.steps.length - 1 && (
                    <RailSegment filled={state === "completed"} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}

function StatusStrip({
  workflowName,
  currentStep,
  totalSteps,
  completedCount,
}: {
  workflowName: string;
  currentStep: number;
  totalSteps: number;
  completedCount: number;
}) {
  const progress = (completedCount / totalSteps) * 100;
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="mb-3 overflow-hidden rounded-md border border-brand-200 bg-brand-50/70"
    >
      <div className="px-3 py-2 flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-500 opacity-45" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-600" />
        </span>
        <span className="text-xs font-semibold text-brand-900">
          Running {workflowName}
        </span>
        <span className="text-[11px] text-brand-700 ml-auto font-mono tabular-nums">
          step {currentStep || completedCount} of {totalSteps}
        </span>
      </div>
      <div className="h-1 bg-brand-100">
        <motion.div
          className="h-full bg-brand-600"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
        />
      </div>
    </motion.div>
  );
}

function RailSegment({ filled }: { filled: boolean }) {
  return (
    <div className="flex justify-start pl-[20px] py-0.5" aria-hidden>
      <div
        className={cn(
          "w-[2px] h-3 rounded-full transition-colors duration-500",
          filled ? "bg-brand-500" : "bg-neutral-200",
        )}
      />
    </div>
  );
}

function WorkflowNode({
  index,
  name,
  state,
  humanInTheLoop,
  guardrailCondition,
  autoExecute,
  durationMs,
}: {
  index: number;
  name: string;
  state: "idle" | "running" | "completed";
  humanInTheLoop: boolean;
  guardrailCondition?: string;
  autoExecute: boolean;
  durationMs?: number;
}) {
  return (
    <Card
      className={cn(
        "relative gap-1 overflow-hidden p-3",
        state === "running" && "border-brand-400 bg-brand-50/75",
        state === "completed" && "border-brand-300 bg-brand-50/50",
        state === "idle" &&
          "bg-[color:color-mix(in_oklch,var(--color-surface-card)_72%,var(--color-brand-50))]",
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <span
          className={cn(
            "h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
            state === "completed"
              ? "bg-brand-100 text-brand-700"
              : state === "running"
                ? "bg-brand-100 text-brand-700 ring-2 ring-brand-500/40"
                : "bg-neutral-200 text-neutral-600",
          )}
        >
          {state === "running" ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : state === "completed" ? (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
            >
              <Check className="h-3 w-3" />
            </motion.span>
          ) : (
            index
          )}
        </span>
        <span className="font-medium text-sm truncate">{name}</span>
        {state === "completed" && durationMs !== undefined && (
          <span className="ml-auto font-mono tabular-nums text-[10px] text-neutral-500 tabular-nums shrink-0">
            {durationMs}ms
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1 ml-7">
        {humanInTheLoop && (
          <Badge variant="outline" className="text-[10px] gap-1">
            <AlertCircle className="h-2.5 w-2.5" />
            Human in loop
          </Badge>
        )}
        <Badge
          variant="outline"
          className={cn(
            "text-[10px]",
            autoExecute
              ? "border-emerald-300 text-emerald-700"
              : "border-amber-300 text-amber-700",
          )}
        >
          {autoExecute ? "Auto" : "Manual"}
        </Badge>
      </div>
      {guardrailCondition && (
        <div className="ml-7 mt-1.5 flex items-start gap-1.5 text-[11px] text-neutral-600 leading-snug">
          <span className="text-neutral-400 mt-px">↳</span>
          <span>{guardrailCondition}</span>
        </div>
      )}

      {/* Indeterminate progress bar for running state */}
      {state === "running" && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand-100 overflow-hidden">
          <div className="absolute inset-y-0 w-1/3 bg-brand-500/70 motion-safe:animate-[indeterminate_1.4s_ease-in-out_infinite]" />
        </div>
      )}
    </Card>
  );
}

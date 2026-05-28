"use client";

import { skills } from "@/data/skills";
import { workflows } from "@/data/workflows";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, ChevronRight, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

type Props = {
  activeSkillId?: string;
  completedSkillIds: string[];
  workflowId?: string;
};

export function ComposerTab({
  activeSkillId,
  completedSkillIds,
  workflowId,
}: Props) {
  // Default to OneCallLending workflow if no active workflow yet
  const workflow =
    workflows.find((w) => w.id === workflowId) ??
    workflows.find((w) => w.name === "OneCallLending") ??
    workflows[0];

  return (
    <ScrollArea className="h-full">
      <div className="p-4">
        <div className="mb-3">
          <div className="flex items-baseline gap-2 mb-1">
            <h3 className="font-semibold text-base tracking-tight">
              {workflow.displayName ?? workflow.name}
            </h3>
            <span
              className="font-mono text-[10px] text-neutral-400"
              title={`Workflow ID: ${workflow.id}`}
            >
              {workflow.id}
            </span>
          </div>
          <p className="text-xs text-neutral-600 leading-snug">
            {workflow.description}
          </p>
          <div className="flex flex-wrap items-center gap-1 mt-2">
            <span className="text-[10px] text-neutral-500">Triggers on</span>
            {workflow.triggerIntents.map((i) => (
              <Badge key={i} variant="secondary" className="font-mono text-[10px]">
                {i}
              </Badge>
            ))}
          </div>
        </div>

        <div className="border-t border-neutral-200 pt-3">
          <div className="space-y-1">
            {workflow.steps.map((step, idx) => {
              const skill = skills.find((s) => s.id === step.skillId);
              if (!skill) return null;

              const state: "idle" | "running" | "completed" =
                completedSkillIds.includes(step.skillId)
                  ? "completed"
                  : activeSkillId === step.skillId
                    ? "running"
                    : "idle";

              return (
                <div key={step.skillId}>
                  <WorkflowNode
                    index={idx + 1}
                    name={step.displayName ?? skill.name}
                    state={state}
                    humanInTheLoop={step.humanInTheLoop}
                    guardrailCondition={step.guardrails.condition}
                    autoExecute={step.guardrails.autoExecute}
                  />
                  {idx < workflow.steps.length - 1 && (
                    <div className="flex justify-center my-1">
                      <ChevronRight className="h-3 w-3 text-neutral-400 rotate-90" />
                    </div>
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

function WorkflowNode({
  index,
  name,
  state,
  humanInTheLoop,
  guardrailCondition,
  autoExecute,
}: {
  index: number;
  name: string;
  state: "idle" | "running" | "completed";
  humanInTheLoop: boolean;
  guardrailCondition?: string;
  autoExecute: boolean;
}) {
  return (
    <Card
      className={cn(
        "p-3 transition relative overflow-hidden gap-1",
        state === "running" &&
          "border-blue-500 shadow-[0_0_0_3px_rgba(59,130,246,0.15)]",
        state === "completed" && "border-emerald-500 bg-emerald-50/30",
        state === "idle" && "bg-neutral-50/50",
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <span
          className={cn(
            "h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold",
            state === "completed"
              ? "bg-emerald-100 text-emerald-700"
              : state === "running"
                ? "bg-blue-100 text-blue-700"
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
        <span className="font-medium text-sm">{name}</span>
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
    </Card>
  );
}

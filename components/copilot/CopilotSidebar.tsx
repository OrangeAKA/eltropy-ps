"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  Send,
  Edit3,
  AlertTriangle,
} from "lucide-react";
import type { DemoState, LoanOffer } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  state: DemoState;
  onConfirm: () => void;
  onModify: () => void;
};

const PHASE_LABEL: Record<DemoState["phase"], string> = {
  idle: "Idle",
  ingesting: "Ingesting trigger",
  resolving_member: "Resolving member",
  classifying_intent: "Classifying intent",
  routing_workflow: "Routing workflow",
  executing_skill: "Executing workflow",
  awaiting_human_confirm: "Awaiting your approval",
  executing_post_confirm: "Dispatching offer",
  completed: "Complete",
};

export function CopilotSidebar({ state, onConfirm, onModify }: Props) {
  const isActive = state.phase !== "idle";
  const offer = state.context.loanOffer;
  const intent = state.context.intent;

  return (
    <div className="flex flex-col h-full bg-neutral-50/40">
      <div className="px-3 py-2 border-b border-neutral-200 bg-white">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-blue-600" />
          <span className="text-xs font-semibold">Copilot</span>
          <span className="ml-auto text-[10px] text-neutral-500">
            {PHASE_LABEL[state.phase]}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {!isActive && <IdleState />}

        {isActive && (
          <>
            {/* Intent classification */}
            {intent && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <Card className="p-2.5 bg-white gap-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    <span className="text-[10px] uppercase tracking-wide text-neutral-600 font-medium">
                      Intent
                    </span>
                    <Badge
                      variant="outline"
                      className="ml-auto text-[9px] font-mono"
                    >
                      {(intent.confidence * 100).toFixed(0)}% conf.
                    </Badge>
                  </div>
                  <div className="text-xs font-medium">
                    {intent.intent.replace("_", " ")}
                  </div>
                  {Object.keys(intent.entities).length > 0 && (
                    <div className="text-[11px] text-neutral-600 mt-0.5">
                      {Object.entries(intent.entities).map(([k, v]) => (
                        <div key={k} className="font-mono">
                          <span className="text-neutral-500">{k}:</span>{" "}
                          <span>{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </motion.div>
            )}

            {/* Active skill */}
            {state.activeSkillId && state.phase === "executing_skill" && (
              <ActiveSkillCard skillId={state.activeSkillId} />
            )}

            {/* Loan offer recommendation */}
            <AnimatePresence>
              {state.phase === "awaiting_human_confirm" && offer && (
                <OfferCard
                  offer={offer}
                  onConfirm={onConfirm}
                  onModify={onModify}
                />
              )}
            </AnimatePresence>

            {/* Completion summary */}
            <AnimatePresence>
              {state.phase === "completed" && offer && (
                <CompletionCard
                  offer={offer}
                  totalLogs={state.auditLog.length}
                  elapsedMs={state.auditLog[state.auditLog.length - 1]?.elapsedMs ?? 0}
                />
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}

function IdleState() {
  return (
    <Card className="p-3 border-dashed bg-white/50 gap-1">
      <div className="flex items-start gap-2">
        <Sparkles className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
        <div className="text-xs text-neutral-600 leading-snug">
          <div className="font-medium text-neutral-800 mb-1">
            Ready to assist
          </div>
          <p>
            Once a member contacts you, I'll surface their context, run the
            assigned workflow, and recommend a next action for your approval.
          </p>
        </div>
      </div>
    </Card>
  );
}

function ActiveSkillCard({ skillId }: { skillId: string }) {
  const label = skillId
    .replace("skill-", "")
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="p-2.5 bg-blue-50/50 border-blue-200 gap-1">
        <div className="flex items-center gap-2">
          <Loader2 className="h-3.5 w-3.5 text-blue-600 animate-spin" />
          <span className="text-xs text-blue-900 font-medium">{label}…</span>
        </div>
      </Card>
    </motion.div>
  );
}

function OfferCard({
  offer,
  onConfirm,
  onModify,
}: {
  offer: LoanOffer;
  onConfirm: () => void;
  onModify: () => void;
}) {
  if (!offer.approved) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="p-3 border-amber-300 bg-amber-50 gap-1">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-amber-700" />
            <span className="font-medium text-sm text-amber-900">
              Decisioning: Manual review required
            </span>
          </div>
          <p className="text-xs text-amber-800 leading-snug">{offer.rationale}</p>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-3 border-blue-300 shadow-md gap-2">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-4 w-4 text-blue-600" />
          <span className="font-medium text-sm">Pre-qualified offer</span>
          <Badge className="ml-auto bg-emerald-100 text-emerald-700 text-[10px]">
            Approved
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <OfferStat label="Amount" value={`$${offer.amount.toLocaleString()}`} />
          <OfferStat label="Term" value={`${offer.termMonths} mo`} />
          <OfferStat
            label="APR"
            value={`${offer.apr.toFixed(2)}%`}
            highlight
          />
          <OfferStat
            label="Monthly"
            value={`$${offer.monthlyPayment.toFixed(2)}`}
          />
        </div>

        <div className="bg-neutral-50 border border-neutral-200 rounded p-2 text-[10px] leading-snug text-neutral-700 mt-1">
          <div className="font-medium text-neutral-800 mb-0.5">Rationale</div>
          {offer.rationale}
        </div>

        <div className="bg-blue-50/50 border border-blue-200 rounded p-2 text-[10px] leading-snug text-blue-900 mt-1">
          <div className="font-medium mb-0.5">Truth-in-Lending</div>
          {offer.disclosure}
        </div>

        <div className="flex gap-1.5 mt-2">
          <Button
            onClick={onConfirm}
            size="sm"
            className="flex-1 h-8 gap-1.5"
          >
            <Send className="h-3.5 w-3.5" />
            Confirm & send
          </Button>
          <Button
            onClick={onModify}
            size="sm"
            variant="outline"
            className="h-8 gap-1.5"
          >
            <Edit3 className="h-3.5 w-3.5" />
            Modify
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

function OfferStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-wide text-neutral-500">
        {label}
      </div>
      <div
        className={cn(
          "font-mono font-medium",
          highlight && "text-blue-700",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function CompletionCard({
  offer,
  totalLogs,
  elapsedMs,
}: {
  offer: LoanOffer;
  totalLogs: number;
  elapsedMs: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
    >
      <Card className="p-3 border-emerald-300 bg-emerald-50 gap-1">
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle2 className="h-4 w-4 text-emerald-700" />
          <span className="font-medium text-sm text-emerald-900">
            Loan funded
          </span>
        </div>
        <p className="text-xs text-emerald-800 leading-snug">
          ${offer.amount.toLocaleString()} / {offer.termMonths} mo /{" "}
          {offer.apr.toFixed(2)}% APR / ${offer.monthlyPayment.toFixed(2)}/mo.
          E-sign link dispatched to member.
        </p>
        <div className="grid grid-cols-2 gap-2 mt-2 text-[10px]">
          <div>
            <div className="text-emerald-700/70 uppercase tracking-wide">
              Audit events
            </div>
            <div className="font-mono text-emerald-900">{totalLogs}</div>
          </div>
          <div>
            <div className="text-emerald-700/70 uppercase tracking-wide">
              Total time
            </div>
            <div className="font-mono text-emerald-900">
              {(elapsedMs / 1000).toFixed(1)}s
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

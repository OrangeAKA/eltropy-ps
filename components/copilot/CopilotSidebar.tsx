"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  CheckCircle2,
  Send,
  Edit3,
  AlertTriangle,
  ShieldAlert,
  Wallet,
  Clock,
} from "lucide-react";
import { EltropyMark } from "@/components/shared/EltropyMark";
import type {
  DemoState,
  LoanOffer,
  DisputeDetails,
  AccountSummary,
} from "@/lib/types";
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
  const dispute = state.context.disputeDetails;
  const summary = state.context.accountSummary;
  const intent = state.context.intent;
  const awaitingDispute =
    state.awaitingConfirmFor?.skillId === "skill-dispute-file";

  return (
    <div className="flex flex-col h-full bg-neutral-50/40">
      <div className="px-3 py-2 border-b border-neutral-200 bg-white">
        <div className="flex items-center gap-1.5">
          <EltropyMark className="h-3.5 w-3.5 text-brand-600" />
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
                      className="ml-auto text-[9px] font-mono tabular-nums"
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
                        <div key={k} className="font-mono tabular-nums">
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

            {/* Account summary (balance_inquiry flow) */}
            <AnimatePresence>
              {summary && <AccountSummaryCard summary={summary} />}
            </AnimatePresence>

            {/* Dispute review gate */}
            <AnimatePresence>
              {state.phase === "awaiting_human_confirm" &&
                awaitingDispute &&
                dispute && (
                  <DisputeReviewCard
                    dispute={dispute}
                    onConfirm={onConfirm}
                    onModify={onModify}
                  />
                )}
            </AnimatePresence>

            {/* Loan offer recommendation */}
            <AnimatePresence>
              {state.phase === "awaiting_human_confirm" &&
                !awaitingDispute &&
                offer && (
                  <OfferCard
                    offer={offer}
                    onConfirm={onConfirm}
                    onModify={onModify}
                  />
                )}
            </AnimatePresence>

            {/* Completion summary */}
            <AnimatePresence>
              {state.phase === "completed" && offer && offer.approved && (
                <CompletionCard
                  offer={offer}
                  totalLogs={state.auditLog.length}
                  elapsedMs={state.auditLog[state.auditLog.length - 1]?.elapsedMs ?? 0}
                />
              )}
              {state.phase === "completed" && offer && !offer.approved && (
                <DeclinedCard
                  offer={offer}
                  totalLogs={state.auditLog.length}
                  elapsedMs={state.auditLog[state.auditLog.length - 1]?.elapsedMs ?? 0}
                />
              )}
              {state.phase === "completed" && dispute && !offer && (
                <DisputeCompletionCard
                  dispute={dispute}
                  totalLogs={state.auditLog.length}
                  elapsedMs={state.auditLog[state.auditLog.length - 1]?.elapsedMs ?? 0}
                />
              )}
              {state.phase === "completed" && summary && !offer && !dispute && (
                <BalanceCompletionCard
                  summary={summary}
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
    <div className="text-xs text-neutral-500 leading-snug px-1 py-2">
      Intent, active skill, and recommended offer will appear here once a
      member contacts you.
    </div>
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
      <Card className="p-2.5 bg-brand-50/60 border-brand-200 gap-1">
        <div className="flex items-center gap-2">
          <Loader2 className="h-3.5 w-3.5 text-brand-600 animate-spin" />
          <span className="text-xs text-brand-900 font-medium">{label}…</span>
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
      <Card className="p-3 border-brand-300 shadow-md gap-2">
        <div className="flex items-center gap-2 mb-1">
          <EltropyMark className="h-4 w-4 text-brand-600" />
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

        <div className="bg-brand-50/60 border border-brand-200 rounded p-2 text-[10px] leading-snug text-brand-900 mt-1">
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
            Send offer to member
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
          "font-mono tabular-nums font-medium",
          highlight && "text-brand-700",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function DisputeReviewCard({
  dispute,
  onConfirm,
  onModify,
}: {
  dispute: DisputeDetails;
  onConfirm: () => void;
  onModify: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-3 border-amber-300 shadow-md gap-2">
        <div className="flex items-center gap-2 mb-1">
          <ShieldAlert className="h-4 w-4 text-amber-700" />
          <span className="font-medium text-sm">Dispute under Reg E review</span>
          <Badge className="ml-auto bg-amber-100 text-amber-800 text-[10px]">
            Officer gate
          </Badge>
        </div>

        <div className="bg-white border border-neutral-200 rounded p-2 text-xs">
          <div className="font-medium text-neutral-900">{dispute.merchant}</div>
          <div className="text-[11px] text-neutral-600 mt-0.5">
            {dispute.transactionDate} &middot; card ending {dispute.cardLast4}
          </div>
          <div className="font-mono tabular-nums text-base font-semibold text-amber-900 mt-1">
            ${dispute.amount.toFixed(2)}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="flex items-start gap-1.5">
            <Clock className="h-3 w-3 text-amber-700 mt-0.5 shrink-0" />
            <div>
              <div className="text-neutral-500 uppercase tracking-wide text-[9px]">
                Reg E window
              </div>
              <div className="font-mono tabular-nums text-neutral-800">
                {dispute.regEDaysRemaining} business days
              </div>
            </div>
          </div>
          <div className="flex items-start gap-1.5">
            <ShieldAlert className="h-3 w-3 text-amber-700 mt-0.5 shrink-0" />
            <div>
              <div className="text-neutral-500 uppercase tracking-wide text-[9px]">
                Liability cap
              </div>
              <div className="font-mono tabular-nums text-neutral-800">
                ${dispute.liabilityCapUsd}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-amber-50/60 border border-amber-200 rounded p-2 text-[10px] leading-snug text-amber-900 mt-1">
          {dispute.provisionalCreditEligible
            ? `Eligible for provisional credit ($${dispute.amount.toFixed(2)} under $2,500 threshold). Filing will issue funds to checking today per 12 CFR 1005.11(c)(2).`
            : `Amount over $2,500 provisional-credit threshold. Filing triggers a 45-90 day investigation. Member will be notified of next steps.`}
        </div>

        <div className="flex gap-1.5 mt-2">
          <Button
            onClick={onConfirm}
            size="sm"
            className="flex-1 h-8 gap-1.5 bg-amber-700 hover:bg-amber-800"
          >
            <Send className="h-3.5 w-3.5" />
            File dispute
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

function AccountSummaryCard({ summary }: { summary: AccountSummary }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card className="p-2.5 bg-white gap-2">
        <div className="flex items-center gap-1.5 mb-1">
          <Wallet className="h-3 w-3 text-brand-700" />
          <span className="text-[10px] uppercase tracking-wide text-neutral-600 font-medium">
            Account snapshot
          </span>
        </div>
        <div className="space-y-1 text-xs">
          {summary.accounts.map((a) => (
            <div
              key={a.accountId}
              className="flex items-baseline justify-between gap-2 border-b border-neutral-100 last:border-0 pb-1 last:pb-0"
            >
              <div className="min-w-0">
                <div className="font-medium text-neutral-800 truncate">
                  {a.type.replace("_", " ")}
                </div>
                <div className="text-[10px] text-neutral-500 font-mono tabular-nums">
                  {a.accountId}
                </div>
              </div>
              <div className="font-mono tabular-nums text-sm font-medium text-neutral-900 shrink-0">
                ${a.balance.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
          ))}
        </div>
        {summary.recentTransactions.length > 0 && (
          <div className="mt-1 pt-1.5 border-t border-neutral-200">
            <div className="text-[9px] uppercase tracking-wide text-neutral-500 mb-1">
              Recent activity
            </div>
            <div className="space-y-0.5">
              {summary.recentTransactions.slice(0, 3).map((t, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-[10px] text-neutral-700"
                >
                  <span className="truncate mr-2">{t.description}</span>
                  <span className="font-mono tabular-nums shrink-0 text-red-700">
                    -${Math.abs(t.amount).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </motion.div>
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
            Offer dispatched, awaiting signature
          </span>
        </div>
        <p className="text-xs text-emerald-800 leading-snug">
          ${offer.amount.toLocaleString()} / {offer.termMonths} mo /{" "}
          {offer.apr.toFixed(2)}% APR / ${offer.monthlyPayment.toFixed(2)}/mo.
          E-sign link sent to member; funding releases on signature.
        </p>
        <div className="grid grid-cols-2 gap-2 mt-2 text-[10px]">
          <div>
            <div className="text-emerald-700/70 uppercase tracking-wide">
              Audit events
            </div>
            <div className="font-mono tabular-nums text-emerald-900">{totalLogs}</div>
          </div>
          <div>
            <div className="text-emerald-700/70 uppercase tracking-wide">
              Total time
            </div>
            <div className="font-mono tabular-nums text-emerald-900">
              {(elapsedMs / 1000).toFixed(1)}s
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function DeclinedCard({
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
      <Card className="p-3 border-amber-300 bg-amber-50 gap-1">
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle className="h-4 w-4 text-amber-700" />
          <span className="font-medium text-sm text-amber-900">
            Not approved, routed to officer follow-up
          </span>
        </div>
        <p className="text-xs text-amber-900 leading-snug">{offer.rationale}</p>
        <div className="bg-white/60 border border-amber-200 rounded p-2 text-[10px] leading-snug text-amber-900 mt-1">
          Next step: officer schedules a follow-up call within one business day
          to walk through credit counseling, secured-card pre-approval, or a
          smaller principal option.
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2 text-[10px]">
          <div>
            <div className="text-amber-700/80 uppercase tracking-wide">
              Audit events
            </div>
            <div className="font-mono tabular-nums text-amber-900">{totalLogs}</div>
          </div>
          <div>
            <div className="text-amber-700/80 uppercase tracking-wide">
              Total time
            </div>
            <div className="font-mono tabular-nums text-amber-900">
              {(elapsedMs / 1000).toFixed(1)}s
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function DisputeCompletionCard({
  dispute,
  totalLogs,
  elapsedMs,
}: {
  dispute: DisputeDetails;
  totalLogs: number;
  elapsedMs: number;
}) {
  const eligible = dispute.provisionalCreditEligible;
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
            Dispute filed
          </span>
        </div>
        <p className="text-xs text-emerald-800 leading-snug">
          {eligible
            ? `Provisional credit of $${dispute.amount.toFixed(2)} issued. Network investigation 45-90 days; member notified.`
            : `Filed with Velera. Network investigation 45-90 days. Member notified.`}
        </p>
        <div className="grid grid-cols-2 gap-2 mt-2 text-[10px]">
          <div>
            <div className="text-emerald-700/70 uppercase tracking-wide">
              Audit events
            </div>
            <div className="font-mono tabular-nums text-emerald-900">{totalLogs}</div>
          </div>
          <div>
            <div className="text-emerald-700/70 uppercase tracking-wide">
              Total time
            </div>
            <div className="font-mono tabular-nums text-emerald-900">
              {(elapsedMs / 1000).toFixed(1)}s
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function BalanceCompletionCard({
  summary,
  totalLogs,
  elapsedMs,
}: {
  summary: AccountSummary;
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
            Read-back complete
          </span>
        </div>
        <p className="text-xs text-emerald-800 leading-snug">
          {summary.accounts.length} account{summary.accounts.length === 1 ? "" : "s"} surfaced. Total deposits ${summary.totalDeposits.toFixed(2)}.
        </p>
        <div className="grid grid-cols-2 gap-2 mt-2 text-[10px]">
          <div>
            <div className="text-emerald-700/70 uppercase tracking-wide">
              Audit events
            </div>
            <div className="font-mono tabular-nums text-emerald-900">{totalLogs}</div>
          </div>
          <div>
            <div className="text-emerald-700/70 uppercase tracking-wide">
              Total time
            </div>
            <div className="font-mono tabular-nums text-emerald-900">
              {(elapsedMs / 1000).toFixed(1)}s
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Loader2,
  CheckCircle2,
  Send,
  Edit3,
  AlertTriangle,
  ShieldAlert,
  Clock,
  Smartphone,
  ArrowRightLeft,
  PhoneCall,
} from "lucide-react";
import { EltropyMark } from "@/components/shared/EltropyMark";
import type {
  DemoState,
  LoanOffer,
  DisputeDetails,
  AccountSummary,
  TransferDetails,
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
  const transfer = state.context.transferDetails;
  const intent = state.context.intent;
  const awaitingDispute =
    state.awaitingConfirmFor?.skillId === "skill-dispute-file";
  const awaitingTransfer =
    state.awaitingConfirmFor?.skillId === "skill-transfer-execute";
  const stepUpInFlight =
    state.activeSkillId === "skill-stepup-auth" &&
    state.phase === "executing_skill";
  // For voice-channel, in-policy-threshold transfers, the auth method is
  // verbal-on-voice — no out-of-band wait. The section content adapts.
  const channel = state.context.trigger?.channel;
  const stepUpIsVerbal =
    channel === "voice" &&
    transfer !== undefined &&
    transfer.amount < 25_000;
  const reduceMotion = useReducedMotion();

  return (
    <div className="flex h-full flex-col bg-[color:color-mix(in_oklch,var(--color-brand-50)_18%,white)]">
      <div className="border-b border-rule bg-[color:color-mix(in_oklch,var(--color-surface-card)_92%,white)] px-3 py-2.5">
        <div className="flex items-start gap-2">
          <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-lg border border-brand-200 bg-brand-50">
            <EltropyMark className="h-3.5 w-3.5 text-brand-700" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-neutral-900">
                Copilot brief
              </span>
              <Badge
                variant="outline"
                className="h-5 rounded-full border-rule bg-white px-1.5 text-[9px] uppercase tracking-[0.12em] text-neutral-600"
              >
                {PHASE_LABEL[state.phase]}
              </Badge>
            </div>
            <p className="mt-1 text-[11px] leading-snug text-neutral-500">
              Intent, active skill, and officer approval context stay visible
              here while the conversation progresses.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {!isActive && (
          <div className="p-3">
            <IdleState />
          </div>
        )}

        {isActive && (
          <>
            {intent && (
              <motion.section
                initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.24, ease: [0.25, 1, 0.5, 1] }}
                className="border-b border-rule px-3 py-2.5"
              >
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <SectionLabel>Intent</SectionLabel>
                  <span className="text-[10px] font-mono tabular-nums text-neutral-500">
                    {(intent.confidence * 100).toFixed(0)}% conf.
                  </span>
                </div>
                <div className="text-xs font-medium text-neutral-900">
                  {intent.intent.replaceAll("_", " ")}
                </div>
                {Object.keys(intent.entities).length > 0 && (
                  <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-[11px]">
                    {Object.entries(intent.entities).map(([key, value]) => (
                      <div key={key} className="contents">
                        <dt className="font-mono tabular-nums text-neutral-500">
                          {key}
                        </dt>
                        <dd className="font-mono tabular-nums text-neutral-800">
                          {String(value)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
              </motion.section>
            )}

            {state.activeSkillId &&
              state.phase === "executing_skill" &&
              !stepUpInFlight && (
                <ActiveSkillSection skillId={state.activeSkillId} />
              )}

            {stepUpInFlight && transfer && (
              <StepUpAuthPendingSection
                transfer={transfer}
                verbal={stepUpIsVerbal}
              />
            )}

            <AnimatePresence>
              {summary && <AccountSummarySection summary={summary} />}
            </AnimatePresence>

            {state.awaitingConfirmFor && (
              <AwaitingApprovalSection
                title={state.awaitingConfirmFor.title}
                summary={state.awaitingConfirmFor.summary}
              />
            )}

            <div className="space-y-2 p-3">
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

              <AnimatePresence>
                {state.phase === "awaiting_human_confirm" &&
                  awaitingTransfer &&
                  transfer && (
                    <OfficerConfirmTransferCard
                      transfer={transfer}
                      onConfirm={onConfirm}
                      onModify={onModify}
                    />
                  )}
              </AnimatePresence>

              <AnimatePresence>
                {state.phase === "awaiting_human_confirm" &&
                  !awaitingDispute &&
                  !awaitingTransfer &&
                  offer && (
                    <OfferCard
                      offer={offer}
                      onConfirm={onConfirm}
                      onModify={onModify}
                    />
                  )}
              </AnimatePresence>

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
                {state.phase === "completed" &&
                  summary &&
                  !offer &&
                  !dispute &&
                  !transfer && (
                    <BalanceCompletionCard
                      summary={summary}
                      totalLogs={state.auditLog.length}
                      elapsedMs={state.auditLog[state.auditLog.length - 1]?.elapsedMs ?? 0}
                    />
                  )}
                {state.phase === "completed" &&
                  transfer &&
                  transfer.execution && (
                    <TransferCompletionCard
                      transfer={transfer}
                      totalLogs={state.auditLog.length}
                      elapsedMs={state.auditLog[state.auditLog.length - 1]?.elapsedMs ?? 0}
                    />
                  )}
                {state.phase === "completed" &&
                  transfer &&
                  !transfer.execution && (
                    <TransferEscalatedCard
                      transfer={transfer}
                      totalLogs={state.auditLog.length}
                      elapsedMs={state.auditLog[state.auditLog.length - 1]?.elapsedMs ?? 0}
                    />
                  )}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-neutral-500">
      {children}
    </span>
  );
}

function IdleState() {
  return (
    <Card className="gap-2 p-3 bg-[color:color-mix(in_oklch,var(--color-surface-card)_88%,white)]">
      <div className="flex items-center gap-2">
        <EltropyMark className="h-4 w-4 text-brand-600" />
        <span className="text-sm font-medium text-neutral-900">
          Waiting for member context
        </span>
      </div>
      <p className="text-xs leading-relaxed text-neutral-600">
        Once a trigger arrives, this panel will show the classified intent,
        account summary, active skill, and any human approval gate before an
        outbound action occurs.
      </p>
    </Card>
  );
}

function ActiveSkillSection({ skillId }: { skillId: string }) {
  const label = skillId
    .replace("skill-", "")
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  return (
    <motion.section
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.25, 1, 0.5, 1] }}
      className="border-b border-rule px-3 py-2.5"
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <SectionLabel>Active skill</SectionLabel>
        <span className="text-[10px] font-mono text-brand-700">live</span>
      </div>
      <div className="flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50/80 px-2.5 py-2">
        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-brand-600" />
        <div className="min-w-0">
          <div className="text-xs font-medium text-brand-900">{label}</div>
          <div className="text-[10px] text-brand-700">
            Inputs are in flight and the next audit event will stream to runtime.
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function AccountSummarySection({ summary }: { summary: AccountSummary }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.24, ease: [0.25, 1, 0.5, 1] }}
      className="border-b border-rule px-3 py-2.5"
    >
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <SectionLabel>Account snapshot</SectionLabel>
        <span className="text-[10px] font-mono tabular-nums text-neutral-500">
          as of {summary.asOf}
        </span>
      </div>
      <AccountSummaryCard summary={summary} />
    </motion.section>
  );
}

function AwaitingApprovalSection({
  title,
  summary,
}: {
  title: string;
  summary: string;
}) {
  return (
    <section className="border-b border-rule bg-[color:color-mix(in_oklch,var(--color-brand-50)_22%,white)] px-3 py-2.5">
      <div className="mb-1 flex items-center justify-between gap-2">
        <SectionLabel>Officer gate</SectionLabel>
        <Badge
          variant="outline"
          className="h-5 rounded-full border-amber-200 bg-amber-50 px-1.5 text-[9px] uppercase tracking-[0.12em] text-amber-800"
        >
          your approval
        </Badge>
      </div>
      <p className="text-xs font-medium text-neutral-900">{title}</p>
      <p className="mt-1 text-[11px] leading-relaxed text-neutral-600">
        {summary}
      </p>
      <p className="mt-1.5 text-[10px] leading-snug text-neutral-500">
        Sarah, the system needs your sign-off before posting. Your officer ID
        + timestamp will be written to the audit log.
      </p>
    </section>
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
        transition={{ duration: 0.24, ease: [0.25, 1, 0.5, 1] }}
      >
        <Card className="gap-1 border-amber-300 bg-amber-50/85 p-3">
          <div className="mb-1 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-700" />
            <span className="text-sm font-medium text-amber-900">
              Decisioning: manual review required
            </span>
          </div>
          <p className="text-xs leading-relaxed text-amber-800">
            {offer.rationale}
          </p>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.25, 1, 0.5, 1] }}
    >
      <Card className="gap-2 border-brand-300 bg-[color:color-mix(in_oklch,var(--color-surface-card)_92%,white)] p-3">
        <div className="mb-1 flex items-center gap-2">
          <EltropyMark className="h-4 w-4 text-brand-600" />
          <span className="text-sm font-medium text-neutral-900">
            Pre-qualified offer
          </span>
          <Badge className="ml-auto bg-brand-50 text-brand-700 text-[10px]">
            Approved
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <OfferStat label="Amount" value={`$${offer.amount.toLocaleString()}`} />
          <OfferStat label="Term" value={`${offer.termMonths} mo`} />
          <OfferStat label="APR" value={`${offer.apr.toFixed(2)}%`} highlight />
          <OfferStat
            label="Monthly"
            value={`$${offer.monthlyPayment.toFixed(2)}`}
          />
        </div>

        <SurfaceNote title="Rationale">{offer.rationale}</SurfaceNote>
        <SurfaceNote title="Truth-in-Lending" tone="brand">
          {offer.disclosure}
        </SurfaceNote>

        <div className="mt-2 flex gap-1.5">
          <Button onClick={onConfirm} size="sm" className="h-8 flex-1 gap-1.5">
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
      <div className="text-[9px] uppercase tracking-[0.12em] text-neutral-500">
        {label}
      </div>
      <div
        className={cn(
          "font-mono text-sm font-medium tabular-nums text-neutral-900",
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
      transition={{ duration: 0.24, ease: [0.25, 1, 0.5, 1] }}
    >
      <Card className="gap-2 border-amber-300 bg-[color:color-mix(in_oklch,var(--color-surface-card)_92%,white)] p-3">
        <div className="mb-1 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-amber-700" />
          <span className="text-sm font-medium text-neutral-900">
            Dispute under Reg E review
          </span>
          <Badge className="ml-auto bg-amber-50 text-amber-800 text-[10px]">
            Officer gate
          </Badge>
        </div>

        <Card className="gap-1 border-rule bg-white p-2.5">
          <div className="font-medium text-neutral-900">{dispute.merchant}</div>
          <div className="text-[11px] text-neutral-600">
            {dispute.transactionDate} · card ending {dispute.cardLast4}
          </div>
          <div className="font-mono text-base font-semibold tabular-nums text-amber-900">
            ${dispute.amount.toFixed(2)}
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <InlineMetric
            icon={<Clock className="h-3 w-3 text-amber-700" />}
            label="Reg E window"
            value={`${dispute.regEDaysRemaining} business days`}
          />
          <InlineMetric
            icon={<ShieldAlert className="h-3 w-3 text-amber-700" />}
            label="Liability cap"
            value={`$${dispute.liabilityCapUsd}`}
          />
        </div>

        <SurfaceNote title="Policy readback" tone="amber">
          {dispute.provisionalCreditEligible
            ? `Eligible for provisional credit ($${dispute.amount.toFixed(2)} under $2,500 threshold). Filing will issue funds to checking today per 12 CFR 1005.11(c)(2).`
            : "Amount exceeds the provisional-credit threshold. Filing opens a 45-90 day investigation and the member will receive next-step guidance."}
        </SurfaceNote>

        <div className="mt-2 flex gap-1.5">
          <Button
            onClick={onConfirm}
            size="sm"
            className="h-8 flex-1 gap-1.5 bg-amber-700 hover:bg-amber-800"
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
    <Card className="gap-2 bg-[color:color-mix(in_oklch,var(--color-surface-card)_86%,white)] p-2.5">
      <div className="space-y-1 text-xs">
        {summary.accounts.map((account) => (
          <div
            key={account.accountId}
            className="flex items-baseline justify-between gap-2 border-b border-rule pb-1 last:border-0 last:pb-0"
          >
            <div className="min-w-0">
              <div className="truncate font-medium text-neutral-800">
                {account.type.replace("_", " ")}
              </div>
              <div className="font-mono text-[10px] tabular-nums text-neutral-500">
                {account.accountId}
              </div>
            </div>
            <div className="shrink-0 font-mono text-sm font-medium tabular-nums text-neutral-900">
              ${account.balance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>
        ))}
      </div>

      {summary.recentTransactions.length > 0 && (
        <div className="mt-1 border-t border-rule pt-1.5">
          <div className="mb-1 text-[9px] uppercase tracking-[0.12em] text-neutral-500">
            Recent activity
          </div>
          <div className="space-y-0.5">
            {summary.recentTransactions.slice(0, 3).map((transaction, index) => (
              <div
                key={`${transaction.accountId}-${index}`}
                className="flex items-center justify-between gap-2 text-[10px] text-neutral-700"
              >
                <span className="truncate">{transaction.description}</span>
                <span className="shrink-0 font-mono tabular-nums text-rose-700">
                  -${Math.abs(transaction.amount).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
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
    <ResultCard
      tone="success"
      title="Offer dispatched, awaiting signature"
      body={`$${offer.amount.toLocaleString()} / ${offer.termMonths} mo / ${offer.apr.toFixed(2)}% APR / $${offer.monthlyPayment.toFixed(2)}/mo. E-sign link sent to the member; funding releases on signature.`}
      totalLogs={totalLogs}
      elapsedMs={elapsedMs}
    />
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
    <ResultCard
      tone="warning"
      title="Not approved, routed to officer follow-up"
      body={`${offer.rationale} Next step: schedule a follow-up call within one business day to review alternatives, counseling, or a smaller principal option.`}
      totalLogs={totalLogs}
      elapsedMs={elapsedMs}
    />
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
  const body = dispute.provisionalCreditEligible
    ? `Provisional credit of $${dispute.amount.toFixed(2)} issued. Network investigation is open for 45-90 days and the member has been notified.`
    : "Filed with Velera. Network investigation is open for 45-90 days and the member has been notified.";

  return (
    <ResultCard
      tone="success"
      title="Dispute filed"
      body={body}
      totalLogs={totalLogs}
      elapsedMs={elapsedMs}
    />
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
    <ResultCard
      tone="success"
      title="Read-back complete"
      body={`${summary.accounts.length} account${summary.accounts.length === 1 ? "" : "s"} surfaced. Total deposits $${summary.totalDeposits.toFixed(2)}.`}
      totalLogs={totalLogs}
      elapsedMs={elapsedMs}
    />
  );
}

function ResultCard({
  tone,
  title,
  body,
  totalLogs,
  elapsedMs,
}: {
  tone: "success" | "warning";
  title: string;
  body: string;
  totalLogs: number;
  elapsedMs: number;
}) {
  const toneClasses =
    tone === "success"
      ? {
          card: "border-brand-300 bg-brand-50/75",
          icon: "text-brand-700",
          title: "text-brand-900",
          body: "text-brand-800",
          meta: "text-brand-900",
          label: "text-brand-700/80",
        }
      : {
          card: "border-amber-300 bg-amber-50/85",
          icon: "text-amber-700",
          title: "text-amber-900",
          body: "text-amber-900",
          meta: "text-amber-900",
          label: "text-amber-700/80",
        };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
    >
      <Card className={cn("gap-1 p-3", toneClasses.card)}>
        <div className="mb-1 flex items-center gap-2">
          <CheckCircle2 className={cn("h-4 w-4", toneClasses.icon)} />
          <span className={cn("text-sm font-medium", toneClasses.title)}>
            {title}
          </span>
        </div>
        <p className={cn("text-xs leading-relaxed", toneClasses.body)}>{body}</p>
        <div className="mt-2 grid grid-cols-2 gap-2 text-[10px]">
          <div>
            <div className={cn("uppercase tracking-[0.12em]", toneClasses.label)}>
              Audit events
            </div>
            <div className={cn("font-mono tabular-nums", toneClasses.meta)}>
              {totalLogs}
            </div>
          </div>
          <div>
            <div className={cn("uppercase tracking-[0.12em]", toneClasses.label)}>
              Total time
            </div>
            <div className={cn("font-mono tabular-nums", toneClasses.meta)}>
              {(elapsedMs / 1000).toFixed(1)}s
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function SurfaceNote({
  title,
  tone = "default",
  children,
}: {
  title: string;
  tone?: "default" | "brand" | "amber";
  children: React.ReactNode;
}) {
  const toneClass =
    tone === "brand"
      ? "border-brand-200 bg-brand-50/75 text-brand-900"
      : tone === "amber"
        ? "border-amber-200 bg-amber-50/75 text-amber-900"
        : "border-rule bg-[color:color-mix(in_oklch,var(--color-surface-card)_82%,white)] text-neutral-700";

  return (
    <div className={cn("rounded-lg border p-2 text-[10px] leading-snug", toneClass)}>
      <div className="mb-0.5 font-medium">{title}</div>
      {children}
    </div>
  );
}

function StepUpAuthPendingSection({
  transfer,
  verbal,
}: {
  transfer: TransferDetails;
  verbal: boolean;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.25, 1, 0.5, 1] }}
      className="border-b border-rule px-3 py-2.5"
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <SectionLabel>Authorization gate</SectionLabel>
        <span
          className={cn(
            "text-[10px] font-mono",
            verbal ? "text-brand-700" : "text-amber-700",
          )}
        >
          {verbal ? "verifying policy" : "awaiting member"}
        </span>
      </div>
      {verbal ? (
        <div className="rounded-xl border border-brand-200 bg-brand-50/75 px-2.5 py-2">
          <div className="flex items-center gap-2">
            <PhoneCall className="h-3.5 w-3.5 shrink-0 text-brand-700" />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-brand-900">
                Verbal authorization on recorded line
              </div>
              <div className="text-[10px] text-brand-800">
                Voice channel + identity verified + $
                {transfer.amount.toLocaleString()} under $25K threshold.
                FFIEC risk-based MFA: no separate second factor needed.
              </div>
            </div>
            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-brand-600" />
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-2.5 py-2">
          <div className="flex items-center gap-2">
            <Smartphone className="h-3.5 w-3.5 shrink-0 text-amber-700" />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-amber-900">
                Step-up approval sent
              </div>
              <div className="text-[10px] text-amber-800">
                $ {transfer.amount.toLocaleString()} {transfer.fromAccountType}{" "}
                → {transfer.toAccountType} requires member tap-to-approve on
                their registered device.
              </div>
            </div>
            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-amber-700" />
          </div>
          <div className="mt-1.5 text-[10px] text-amber-800/80 leading-snug">
            Channel or amount triggered out-of-band auth. Execution blocked
            until approved.
          </div>
        </div>
      )}
    </motion.section>
  );
}

function OfficerConfirmTransferCard({
  transfer,
  onConfirm,
  onModify,
}: {
  transfer: TransferDetails;
  onConfirm: () => void;
  onModify: () => void;
}) {
  const method = transfer.stepUp?.method;
  const methodLabel =
    method === "verbal_on_voice"
      ? "Verbal on recorded voice"
      : method === "push_approval"
        ? "Push approval (mobile)"
        : method === "secure_link"
          ? "Secure-link confirm (SMS)"
          : "—";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.25, 1, 0.5, 1] }}
    >
      <Card className="gap-2 border-brand-300 bg-[color:color-mix(in_oklch,var(--color-surface-card)_92%,white)] p-3">
        <div className="mb-1 flex items-center gap-2">
          <ArrowRightLeft className="h-4 w-4 text-brand-700" />
          <span className="text-sm font-medium text-neutral-900">
            Post internal transfer
          </span>
          <Badge className="ml-auto bg-brand-50 text-brand-700 text-[10px]">
            ${transfer.amount.toLocaleString()}
          </Badge>
        </div>

        <p className="text-[11px] leading-snug text-neutral-600">
          Your sign-off, Sarah. Member authorization is on record and the
          rules layer cleared the request — but the system won't post until
          you click below. Your officer ID + timestamp get written to the
          audit log on click.
        </p>

        <Card className="gap-1 border-rule bg-white p-2.5">
          <div className="text-[11px] text-neutral-500 font-mono tabular-nums">
            from {transfer.fromAccountType} · {transfer.fromAccountId ?? "—"}
          </div>
          <div className="text-[11px] text-neutral-500 font-mono tabular-nums">
            to {transfer.toAccountType} · {transfer.toAccountId ?? "—"}
          </div>
        </Card>

        <SurfaceNote title="Member authorization" tone="brand">
          {methodLabel}
          {transfer.stepUp?.deviceLabel && (
            <span className="block text-[10px] text-brand-800/80 mt-0.5">
              {transfer.stepUp.deviceLabel}
            </span>
          )}
        </SurfaceNote>

        {transfer.policy && (
          <SurfaceNote title="Policy clearance">
            Cleared {transfer.policy.citations.length} rule check
            {transfer.policy.citations.length === 1 ? "" : "s"}. Daily used $
            {transfer.policy.dailyUsedUsd.toLocaleString()} of $
            {transfer.policy.dailyLimitUsd.toLocaleString()}.
          </SurfaceNote>
        )}

        <div className="mt-2 flex gap-1.5">
          <Button onClick={onConfirm} size="sm" className="h-8 flex-1 gap-1.5">
            <Send className="h-3.5 w-3.5" />
            Post transfer
          </Button>
          <Button
            onClick={onModify}
            size="sm"
            variant="outline"
            className="h-8 gap-1.5"
          >
            <Edit3 className="h-3.5 w-3.5" />
            Cancel
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

function TransferCompletionCard({
  transfer,
  totalLogs,
  elapsedMs,
}: {
  transfer: TransferDetails;
  totalLogs: number;
  elapsedMs: number;
}) {
  const exec = transfer.execution!;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
    >
      <Card className="gap-2 border-brand-300 bg-brand-50/75 p-3">
        <div className="mb-1 flex items-center gap-2">
          <ArrowRightLeft className="h-4 w-4 text-brand-700" />
          <span className="text-sm font-medium text-brand-900">
            Transfer posted
          </span>
          <Badge className="ml-auto bg-white text-brand-700 text-[10px]">
            ${exec.amount.toLocaleString()}
          </Badge>
        </div>

        <div className="rounded-lg border border-rule bg-white p-2 space-y-1.5">
          <div className="flex items-baseline justify-between gap-2 text-[11px]">
            <span className="font-mono tabular-nums text-neutral-500">
              {exec.fromAccountId}
            </span>
            <span className="font-mono tabular-nums text-neutral-900">
              ${exec.fromNewBalance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-2 text-[11px]">
            <span className="font-mono tabular-nums text-neutral-500">
              {exec.toAccountId}
            </span>
            <span className="font-mono tabular-nums text-neutral-900">
              ${exec.toNewBalance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>

        <SurfaceNote title="Confirmation" tone="brand">
          <span className="font-mono tabular-nums">{exec.confirmationNumber}</span>
          <span className="text-brand-800/80"> · posted via SymXchange</span>
        </SurfaceNote>

        <div className="mt-1 grid grid-cols-2 gap-2 text-[10px]">
          <div>
            <div className="uppercase tracking-[0.12em] text-brand-700/80">
              Audit events
            </div>
            <div className="font-mono tabular-nums text-brand-900">
              {totalLogs}
            </div>
          </div>
          <div>
            <div className="uppercase tracking-[0.12em] text-brand-700/80">
              Total time
            </div>
            <div className="font-mono tabular-nums text-brand-900">
              {(elapsedMs / 1000).toFixed(1)}s
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function TransferEscalatedCard({
  transfer,
  totalLogs,
  elapsedMs,
}: {
  transfer: TransferDetails;
  totalLogs: number;
  elapsedMs: number;
}) {
  const stepUpFailed = transfer.stepUp && !transfer.stepUp.approved;
  const policyBlocked = transfer.policy && !transfer.policy.allowed;
  const title = stepUpFailed
    ? "Routed to officer for callback verification"
    : policyBlocked
      ? "Transfer blocked by policy"
      : "Transfer held pending review";
  const icon = stepUpFailed ? (
    <PhoneCall className="h-4 w-4 text-amber-700" />
  ) : (
    <ShieldAlert className="h-4 w-4 text-amber-700" />
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
    >
      <Card className="gap-2 border-amber-300 bg-amber-50/85 p-3">
        <div className="mb-1 flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium text-amber-900">{title}</span>
        </div>

        <p className="text-xs leading-relaxed text-amber-900">
          {stepUpFailed
            ? `$${transfer.amount.toLocaleString()} ${transfer.fromAccountType} → ${transfer.toAccountType} request received. ${transfer.stepUp?.rationale ?? ""}`
            : policyBlocked
              ? transfer.policy?.rationale ?? ""
              : transfer.escalationReason ?? ""}
        </p>

        {policyBlocked && transfer.policy && (
          <SurfaceNote title="Rule citations" tone="amber">
            <ul className="space-y-0.5 mt-0.5">
              {transfer.policy.citations.map((c, i) => (
                <li key={i} className="font-mono tabular-nums text-[10px]">
                  · {c}
                </li>
              ))}
            </ul>
          </SurfaceNote>
        )}

        <SurfaceNote title="Next step" tone="amber">
          {stepUpFailed
            ? "Sarah will call the member back on a verified line, complete KBA, and re-run the transfer through Mission Control under officer authorization."
            : "Member receives a templated SMS explaining the block + how to proceed (raise the limit, use a different source, or visit a branch)."}
        </SurfaceNote>

        <div className="mt-1 grid grid-cols-2 gap-2 text-[10px]">
          <div>
            <div className="uppercase tracking-[0.12em] text-amber-700/80">
              Audit events
            </div>
            <div className="font-mono tabular-nums text-amber-900">
              {totalLogs}
            </div>
          </div>
          <div>
            <div className="uppercase tracking-[0.12em] text-amber-700/80">
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

function InlineMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-1.5 rounded-lg border border-rule bg-white px-2 py-1.5">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div>
        <div className="text-[9px] uppercase tracking-[0.12em] text-neutral-500">
          {label}
        </div>
        <div className="font-mono tabular-nums text-neutral-800">{value}</div>
      </div>
    </div>
  );
}

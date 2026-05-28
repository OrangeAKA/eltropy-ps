// lib/skills/transaction-lookup.ts
//
// Skill: Transaction Lookup
// Resolves a disputed transaction by amount + merchant + approximate date.
// In production this calls Symitar SymXchange or Velera transaction history.
// Mock: synthesizes a plausible transaction record from the dispute entities.

import type { Member } from "@/data/members";
import type {
  SkillExecutionResult,
  DisputeDetails,
} from "@/lib/types";

export const SKILL_ID = "skill-transaction-lookup";
export const ADAPTER_NAME = "VeleraTransactionLookup-mock";

export type TransactionLookupInputs = {
  member: Member;
  amount: number;
  merchant?: string;
  transactionDate?: string;
  cardLast4?: string;
};

export type TransactionLookupOutputs = {
  dispute: DisputeDetails;
};

export async function executeTransactionLookup(
  inputs: TransactionLookupInputs,
): Promise<SkillExecutionResult<TransactionLookupOutputs>> {
  const startedAt = new Date().toISOString();
  const start = performance.now();
  await wait(380 + Math.random() * 200);

  // Find a credit card on file for the last-4 fallback
  const cardOnFile = inputs.member.products.find((p) => p.type === "credit_card");
  const cardLast4 =
    inputs.cardLast4 ??
    (cardOnFile ? cardOnFile.accountId.slice(-4) : "0000");

  // Resolve a date: if natural language was passed, just stamp "yesterday" or "last week"
  const resolvedDate =
    inputs.transactionDate ?? estimateRecentDate("6 days ago");

  // Reg E gives the member 60 days from statement to report. Provisional
  // credit is required within 10 business days. We'll synthesize "days
  // remaining" as 8 to demonstrate the regulatory urgency.
  const regEDaysRemaining = 8;
  // $50 liability cap if reported within 2 business days (Reg E 1005.6).
  const liabilityCap = 50;

  const dispute: DisputeDetails = {
    transactionId: `TXN-${Date.now().toString().slice(-9)}`,
    amount: inputs.amount,
    merchant: inputs.merchant ?? "UNKNOWN MERCHANT",
    transactionDate: resolvedDate,
    cardLast4,
    reportedAt: startedAt,
    regEDaysRemaining,
    provisionalCreditEligible: inputs.amount <= 2500,
    liabilityCapUsd: liabilityCap,
    rationale: `Transaction matched: $${inputs.amount.toFixed(2)} at ${inputs.merchant ?? "merchant"} on ${resolvedDate}, posted to card ending ${cardLast4}. Member reporting on day 1; Reg E provisional credit window: ${regEDaysRemaining} business days remaining. Liability cap: $${liabilityCap} per 12 CFR 1005.6.`,
  };

  return {
    skillId: SKILL_ID,
    status: "completed",
    startedAt,
    completedAt: new Date().toISOString(),
    durationMs: Math.round(performance.now() - start),
    inputs: {
      memberId: inputs.member.id,
      amount: inputs.amount,
      merchant: inputs.merchant,
      transactionDate: inputs.transactionDate,
    },
    adapter: ADAPTER_NAME,
    outputs: { dispute },
    rationale: dispute.rationale,
  };
}

function estimateRecentDate(natural: string): string {
  // Toy resolver — production calls a proper temporal NLU.
  const offset = natural.includes("week")
    ? 7
    : natural.includes("yesterday")
      ? 1
      : 6;
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return d.toISOString().slice(0, 10);
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

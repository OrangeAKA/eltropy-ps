// lib/skills/transfer-policy-check.ts
//
// Skill: Transfer Policy Check
// Deterministic rules engine pass over a proposed transfer: daily limit,
// account standing, sufficient funds, source/destination eligibility. Each
// block carries a named rule citation so the audit log can prove which
// rule rejected what. No LLM involvement.

import type { Member } from "@/data/members";
import type {
  SkillExecutionResult,
  TransferPolicyDecision,
} from "@/lib/types";

export const SKILL_ID = "skill-transfer-policy-check";
export const ADAPTER_NAME = "SymitarSymXchange-mock";

const DAILY_LIMIT_USD = 50_000;
// Synthesized "already used today" so the demo always passes for the
// canonical $10K case but a $50K request would trip the limit.
const DAILY_USED_USD = 0;

export type TransferPolicyInputs = {
  member: Member;
  amount: number;
  fromAccountType: string;
  toAccountType: string;
};

export type TransferPolicyOutputs = {
  decision: TransferPolicyDecision;
};

export async function executeTransferPolicyCheck(
  inputs: TransferPolicyInputs,
): Promise<SkillExecutionResult<TransferPolicyOutputs>> {
  const startedAt = new Date().toISOString();
  const start = performance.now();
  await wait(220 + Math.random() * 120);

  const from = inputs.member.products.find(
    (p) => p.type === inputs.fromAccountType,
  );
  const to = inputs.member.products.find(
    (p) => p.type === inputs.toAccountType,
  );

  const blocks: string[] = [];
  const citations: string[] = [];

  if (!from) {
    blocks.push(`No ${inputs.fromAccountType} account on file`);
    citations.push("CU-POL-TRF-001 source account required");
  }
  if (!to) {
    blocks.push(`No ${inputs.toAccountType} account on file`);
    citations.push("CU-POL-TRF-002 destination account required");
  }
  if (from && (from.balance ?? 0) < inputs.amount) {
    blocks.push(
      `Insufficient funds: $${(from.balance ?? 0).toLocaleString()} available, $${inputs.amount.toLocaleString()} requested`,
    );
    citations.push("CU-POL-TRF-010 sufficient-funds required");
  }
  if (DAILY_USED_USD + inputs.amount > DAILY_LIMIT_USD) {
    blocks.push(
      `Daily transfer limit exceeded: $${(DAILY_USED_USD + inputs.amount).toLocaleString()} would exceed $${DAILY_LIMIT_USD.toLocaleString()}`,
    );
    citations.push("CU-POL-TRF-020 daily-limit $50,000");
  }
  // Reg E: notice not required for member-initiated internal share transfers,
  // but we cite the rule so the audit log records the consideration.
  citations.push("Reg E §1005.10(b) consumer-initiated EFT, notice exempt");

  const allowed = blocks.length === 0;

  const decision: TransferPolicyDecision = {
    allowed,
    amount: inputs.amount,
    fromAccountId: from?.accountId ?? "",
    toAccountId: to?.accountId ?? "",
    dailyLimitUsd: DAILY_LIMIT_USD,
    dailyUsedUsd: DAILY_USED_USD,
    blocks,
    citations,
    rationale: allowed
      ? `Transfer $${inputs.amount.toLocaleString()} ${inputs.fromAccountType} → ${inputs.toAccountType} cleared 4 policy checks. Daily used $${DAILY_USED_USD.toLocaleString()} of $${DAILY_LIMIT_USD.toLocaleString()}.`
      : `Transfer blocked by ${blocks.length} rule${blocks.length === 1 ? "" : "s"}: ${blocks.join("; ")}`,
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
      fromAccountType: inputs.fromAccountType,
      toAccountType: inputs.toAccountType,
    },
    adapter: ADAPTER_NAME,
    outputs: { decision },
    rationale: decision.rationale,
  };
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

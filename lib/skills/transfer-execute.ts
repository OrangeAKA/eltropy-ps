// lib/skills/transfer-execute.ts
//
// Skill: Internal Transfer Execute
// Posts the atomic debit/credit pair to the member's two share accounts via
// SymXchange. Returns a confirmation number, the post timestamp, and the
// resulting balances. Mock: derives balances from the in-memory member
// record; production runs the actual core ledger call.

import type { Member } from "@/data/members";
import type {
  SkillExecutionResult,
  TransferExecutionResult,
} from "@/lib/types";

export const SKILL_ID = "skill-transfer-execute";
export const ADAPTER_NAME = "SymitarSymXchange-mock";

export type TransferExecuteInputs = {
  member: Member;
  amount: number;
  fromAccountId: string;
  toAccountId: string;
};

export type TransferExecuteOutputs = {
  execution: TransferExecutionResult;
};

export async function executeTransferExecute(
  inputs: TransferExecuteInputs,
): Promise<SkillExecutionResult<TransferExecuteOutputs>> {
  const startedAt = new Date().toISOString();
  const start = performance.now();
  await wait(540 + Math.random() * 200);

  const from = inputs.member.products.find(
    (p) => p.accountId === inputs.fromAccountId,
  );
  const to = inputs.member.products.find(
    (p) => p.accountId === inputs.toAccountId,
  );

  const fromBalanceBefore = from?.balance ?? 0;
  const toBalanceBefore = to?.balance ?? 0;

  const execution: TransferExecutionResult = {
    confirmationNumber: `TXN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    postedAt: new Date().toISOString(),
    fromAccountId: inputs.fromAccountId,
    fromNewBalance: Math.max(0, fromBalanceBefore - inputs.amount),
    toAccountId: inputs.toAccountId,
    toNewBalance: toBalanceBefore + inputs.amount,
    amount: inputs.amount,
  };

  return {
    skillId: SKILL_ID,
    status: "completed",
    startedAt,
    completedAt: execution.postedAt,
    durationMs: Math.round(performance.now() - start),
    inputs: {
      memberId: inputs.member.id,
      amount: inputs.amount,
      fromAccountId: inputs.fromAccountId,
      toAccountId: inputs.toAccountId,
    },
    adapter: ADAPTER_NAME,
    outputs: { execution },
    rationale: `Posted $${inputs.amount.toLocaleString()} debit/credit pair. From ${inputs.fromAccountId} → $${execution.fromNewBalance.toLocaleString()}; to ${inputs.toAccountId} → $${execution.toNewBalance.toLocaleString()}. Confirmation ${execution.confirmationNumber}.`,
  };
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

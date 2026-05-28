// lib/skills/dispute-file.ts
//
// Skill: File Dispute
// Files a card-not-recognized dispute with the network (Velera/Visa).
// Mock: returns a dispute case ID + status. Production calls Velera dispute
// resolution API.

import type { Member } from "@/data/members";
import type {
  SkillExecutionResult,
  DisputeDetails,
} from "@/lib/types";

export const SKILL_ID = "skill-dispute-file";
export const ADAPTER_NAME = "VeleraDisputeAPI-mock";

export type DisputeFileInputs = {
  member: Member;
  dispute: DisputeDetails;
};

export type DisputeFileOutputs = {
  caseId: string;
  status: "filed" | "provisional_credit_issued" | "rejected";
  estimatedResolutionDays: number;
  provisionalCreditAmount: number;
};

export async function executeDisputeFile(
  inputs: DisputeFileInputs,
): Promise<SkillExecutionResult<DisputeFileOutputs>> {
  const startedAt = new Date().toISOString();
  const start = performance.now();
  await wait(450 + Math.random() * 250);

  const caseId = `DSP-${Date.now().toString().slice(-10)}`;
  const provisional = inputs.dispute.provisionalCreditEligible;
  const status: DisputeFileOutputs["status"] = provisional
    ? "provisional_credit_issued"
    : "filed";

  const rationale = provisional
    ? `Dispute filed with Velera (case ${caseId}). Provisional credit of $${inputs.dispute.amount.toFixed(2)} issued to checking account per Reg E 12 CFR 1005.11(c)(2). Network investigation: 45-90 day window. Member notified via SMS.`
    : `Dispute filed with Velera (case ${caseId}). Amount $${inputs.dispute.amount.toFixed(2)} exceeds $2,500 provisional credit threshold; full investigation required. Member notified of next steps via SMS.`;

  return {
    skillId: SKILL_ID,
    status: "completed",
    startedAt,
    completedAt: new Date().toISOString(),
    durationMs: Math.round(performance.now() - start),
    inputs: {
      memberId: inputs.member.id,
      transactionId: inputs.dispute.transactionId,
      amount: inputs.dispute.amount,
    },
    adapter: ADAPTER_NAME,
    outputs: {
      caseId,
      status,
      estimatedResolutionDays: 60,
      provisionalCreditAmount: provisional ? inputs.dispute.amount : 0,
    },
    rationale,
  };
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

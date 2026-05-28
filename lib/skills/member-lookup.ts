// lib/skills/member-lookup.ts
//
// Skill: Member Lookup & Context Pull
// Resolves an inbound contact to a member record and returns full context.
//
// Production replacement: this body calls into the real Symitar adapter
// already provided. No interface change at the skill boundary.

import { lookupByPhone, getAccountSummary, SYMITAR_ADAPTER_NAME } from "@/lib/adapters/symitar-mock";
import type { Member } from "@/data/members";
import type { SkillExecutionResult } from "@/lib/types";

export const SKILL_ID = "skill-member-lookup";

export type MemberLookupInputs = {
  phone?: string;
  memberId?: string;
};

export type MemberLookupOutputs = {
  member: Member;
  accountSummary: {
    totalDeposits: number;
    openLoans: number;
    productCount: number;
  };
  resolvedAt: string;
};

export async function executeMemberLookup(
  inputs: MemberLookupInputs,
): Promise<SkillExecutionResult<MemberLookupOutputs>> {
  const startedAt = new Date().toISOString();
  const start = performance.now();

  if (!inputs.phone && !inputs.memberId) {
    return {
      skillId: SKILL_ID,
      status: "failed",
      startedAt,
      inputs,
      adapter: SYMITAR_ADAPTER_NAME,
      error: "Either phone or memberId required",
    };
  }

  const member = inputs.phone
    ? await lookupByPhone(inputs.phone)
    : null; // memberId path omitted for demo brevity

  if (!member) {
    return {
      skillId: SKILL_ID,
      status: "failed",
      startedAt,
      inputs,
      adapter: SYMITAR_ADAPTER_NAME,
      error: `Member not found for phone=${inputs.phone}`,
    };
  }

  const accountSummary = await getAccountSummary(member.id);
  const completedAt = new Date().toISOString();
  const durationMs = Math.round(performance.now() - start);

  return {
    skillId: SKILL_ID,
    status: "completed",
    startedAt,
    completedAt,
    durationMs,
    inputs,
    adapter: SYMITAR_ADAPTER_NAME,
    outputs: {
      member,
      accountSummary,
      resolvedAt: completedAt,
    },
    rationale: `Resolved ${inputs.phone} to member ${member.id} (${member.fullName}); ${accountSummary.productCount} products, ${accountSummary.openLoans} open loans`,
  };
}

// lib/orchestrator/member-resolver.ts
//
// Resolves an inbound trigger to a core member record by phone, member ID,
// or email. Wraps the Symitar adapter. Production-mode swaps the adapter,
// not this layer.

import { lookupByPhone, lookupById, SYMITAR_ADAPTER_NAME } from "@/lib/adapters/symitar-mock";
import type { Member } from "@/data/members";

export const RESOLVER_NAME = "member-resolver";

export type ResolveResult =
  | { resolved: true; member: Member; adapter: string; lookupMs: number }
  | { resolved: false; reason: string; adapter: string };

export async function resolveMemberByPhone(phone: string): Promise<ResolveResult> {
  const start = performance.now();
  const member = await lookupByPhone(phone);
  const lookupMs = Math.round(performance.now() - start);
  if (!member) {
    return {
      resolved: false,
      reason: `No member found for phone=${phone}`,
      adapter: SYMITAR_ADAPTER_NAME,
    };
  }
  return { resolved: true, member, adapter: SYMITAR_ADAPTER_NAME, lookupMs };
}

export async function resolveMemberById(memberId: string): Promise<ResolveResult> {
  const start = performance.now();
  const member = await lookupById(memberId);
  const lookupMs = Math.round(performance.now() - start);
  if (!member) {
    return {
      resolved: false,
      reason: `No member found for memberId=${memberId}`,
      adapter: SYMITAR_ADAPTER_NAME,
    };
  }
  return { resolved: true, member, adapter: SYMITAR_ADAPTER_NAME, lookupMs };
}

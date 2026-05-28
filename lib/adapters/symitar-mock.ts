// lib/adapters/symitar-mock.ts
//
// Mock implementation of the Symitar SymXchange adapter. In production this
// file is replaced by a real SymXchange SOAP/REST client. The signatures
// below are the contract engineering must preserve.

import { members, type Member } from "@/data/members";

export const SYMITAR_ADAPTER_NAME = "SymitarMock";

/**
 * Look up a member by phone number. In production this hits SymXchange.
 * Returns null if no member matches.
 */
export async function lookupByPhone(phone: string): Promise<Member | null> {
  // Simulate network latency
  await wait(180 + Math.random() * 180);
  return members.find((m) => m.phone === phone) ?? null;
}

/**
 * Look up a member by core ID. In production this hits SymXchange.
 */
export async function lookupById(memberId: string): Promise<Member | null> {
  await wait(120 + Math.random() * 120);
  return members.find((m) => m.id === memberId) ?? null;
}

/**
 * Returns a deposit-and-loan summary for a member. Mock derives it from the
 * products array; production reads from the core's relationship view.
 */
export async function getAccountSummary(memberId: string): Promise<{
  totalDeposits: number;
  openLoans: number;
  productCount: number;
}> {
  const member = members.find((m) => m.id === memberId);
  if (!member) {
    return { totalDeposits: 0, openLoans: 0, productCount: 0 };
  }
  const totalDeposits = member.products
    .filter((p) => p.type === "checking" || p.type === "savings")
    .reduce((sum, p) => sum + (p.balance ?? 0), 0);
  const openLoans = member.products.filter(
    (p) =>
      (p.type === "auto_loan" || p.type === "mortgage" || p.type === "heloc") &&
      (p.balance ?? 0) > 0,
  ).length;
  return { totalDeposits, openLoans, productCount: member.products.length };
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

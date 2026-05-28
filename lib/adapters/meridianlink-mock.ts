// lib/adapters/meridianlink-mock.ts
//
// Mock implementation of the MeridianLink Consumer LOS adapter. Production
// replaces this with the real MeridianLink Consumer or Opening API client.

import type { Member } from "@/data/members";

export const MERIDIANLINK_ADAPTER_NAME = "MeridianLinkMock";

export type SoftCreditResult = {
  fico: number;
  utilization: number;
  openTradelines: number;
  recentInquiries: number;
  bureau: "Experian" | "Equifax" | "TransUnion";
  pulledAt: string;
};

/**
 * Performs a soft credit inquiry against the bureau. Mock returns the member's
 * stored FICO with a small jitter (production hits MeridianLink, which hits
 * the bureau via authorized inquiry).
 */
export async function runSoftCreditPull(member: Member): Promise<SoftCreditResult> {
  await wait(620 + Math.random() * 380);
  return {
    fico: member.fico,
    utilization: estimateUtilization(member),
    openTradelines: member.products.filter((p) =>
      ["credit_card", "auto_loan", "mortgage", "heloc"].includes(p.type),
    ).length,
    recentInquiries: Math.floor(Math.random() * 2),
    bureau: "Experian",
    pulledAt: new Date().toISOString(),
  };
}

function estimateUtilization(member: Member): number {
  // Rough utilization estimate based on credit card balance vs. assumed limit
  const cc = member.products.find((p) => p.type === "credit_card");
  if (!cc || !cc.balance) return 0;
  const assumedLimit = member.memberTier === "prime" ? 15000 : 7500;
  return Math.min(1, cc.balance / assumedLimit);
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

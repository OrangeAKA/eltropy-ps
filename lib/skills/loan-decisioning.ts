// lib/skills/loan-decisioning.ts
//
// Skill: Loan Decisioning
// Runs rule-based loan decisioning. Returns approved/declined plus a
// structured offer with APR, monthly payment, and a defensible rationale
// citing the FICO band, tenure multiplier, and product cap.
//
// THIS IS A SPEC-GRADE SKILL: the logic below is real (deterministic rules);
// production replaces it with the bank's actual underwriting engine. The
// interface and rationale-emission pattern stay.

import type { Member } from "@/data/members";
import type { SkillExecutionResult, LoanOffer } from "@/lib/types";

export const SKILL_ID = "skill-loan-decisioning";
export const ADAPTER_NAME = "EltropyDecisioningRulesV1";

export type LoanDecisioningInputs = {
  member: Member;
  ficoFromBureau: number;
  amount: number;
  termMonths: number;
  productType: "auto_loan" | "mortgage" | "heloc";
};

export type LoanDecisioningOutputs = {
  offer: LoanOffer;
};

// Product caps (max approvable amount before manual underwriting)
const PRODUCT_CAPS: Record<LoanDecisioningInputs["productType"], number> = {
  auto_loan: 75_000,
  heloc: 250_000,
  mortgage: 1_500_000,
};

// FICO → APR base bands (auto_loan, 60-month term reference)
function getRateBand(fico: number): {
  band: LoanOffer["rateBand"];
  baseApr: number;
} {
  if (fico >= 740) return { band: "prime", baseApr: 5.99 };
  if (fico >= 700) return { band: "near-prime", baseApr: 7.49 };
  if (fico >= 660) return { band: "standard", baseApr: 9.99 };
  if (fico >= 620) return { band: "sub-prime", baseApr: 13.49 };
  return { band: "declined", baseApr: 0 };
}

// Tenure adjustment: long-tenure members get a small APR discount
function getTenureAdjustment(tenureYears: number): number {
  if (tenureYears >= 5) return -0.5;
  if (tenureYears >= 2) return -0.25;
  return 0;
}

// Compute monthly payment via standard amortization
function computeMonthlyPayment(
  principal: number,
  aprPercent: number,
  termMonths: number,
): number {
  const r = aprPercent / 100 / 12;
  if (r === 0) return principal / termMonths;
  const m = (principal * r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1);
  return Math.round(m * 100) / 100;
}

export async function executeLoanDecisioning(
  inputs: LoanDecisioningInputs,
): Promise<SkillExecutionResult<LoanDecisioningOutputs>> {
  const startedAt = new Date().toISOString();
  const start = performance.now();

  await wait(420 + Math.random() * 280);

  const cap = PRODUCT_CAPS[inputs.productType];
  const rateBand = getRateBand(inputs.ficoFromBureau);
  const tenureAdj = getTenureAdjustment(inputs.member.tenureYears);

  let offer: LoanOffer;

  if (rateBand.band === "declined") {
    offer = {
      approved: false,
      amount: inputs.amount,
      termMonths: inputs.termMonths,
      apr: 0,
      monthlyPayment: 0,
      rateBand: "declined",
      rationale: `FICO ${inputs.ficoFromBureau} below minimum threshold of 620; offer declined`,
      disclosure: "",
    };
  } else if (inputs.amount > cap) {
    offer = {
      approved: false,
      amount: inputs.amount,
      termMonths: inputs.termMonths,
      apr: 0,
      monthlyPayment: 0,
      rateBand: rateBand.band,
      rationale: `Requested $${inputs.amount.toLocaleString()} exceeds ${inputs.productType} cap of $${cap.toLocaleString()}; routed to manual underwriting`,
      disclosure: "",
    };
  } else {
    const finalApr = Math.max(0, rateBand.baseApr + tenureAdj);
    const monthly = computeMonthlyPayment(inputs.amount, finalApr, inputs.termMonths);
    offer = {
      approved: true,
      amount: inputs.amount,
      termMonths: inputs.termMonths,
      apr: Math.round(finalApr * 100) / 100,
      monthlyPayment: monthly,
      rateBand: rateBand.band,
      rationale: `FICO ${inputs.ficoFromBureau} → ${rateBand.band} band (base ${rateBand.baseApr.toFixed(2)}% APR); tenure ${inputs.member.tenureYears.toFixed(1)}y → ${tenureAdj.toFixed(2)}% adjustment; final APR ${finalApr.toFixed(2)}% on ${inputs.termMonths}-month ${inputs.productType.replace("_", " ")}; principal $${inputs.amount.toLocaleString()} within product cap of $${cap.toLocaleString()}`,
      disclosure: `Truth-in-Lending: APR ${finalApr.toFixed(2)}%, finance charge over term $${(monthly * inputs.termMonths - inputs.amount).toFixed(2)}, total of payments $${(monthly * inputs.termMonths).toFixed(2)}. Subject to verification of stated income and collateral.`,
    };
  }

  const completedAt = new Date().toISOString();

  return {
    skillId: SKILL_ID,
    status: "completed",
    startedAt,
    completedAt,
    durationMs: Math.round(performance.now() - start),
    inputs: {
      memberId: inputs.member.id,
      fico: inputs.ficoFromBureau,
      amount: inputs.amount,
      termMonths: inputs.termMonths,
      productType: inputs.productType,
    },
    adapter: ADAPTER_NAME,
    outputs: { offer },
    rationale: offer.rationale,
  };
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

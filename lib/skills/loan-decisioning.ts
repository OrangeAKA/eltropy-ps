// lib/skills/loan-decisioning.ts
//
// Skill: Loan Decisioning
// Multi-factor rule-based underwriting. Evaluates FICO band, tenure, DTI
// (debt-to-income), LTV (loan-to-value, for collateral loans), and cross-sell
// loyalty signal. Emits a defensible rationale citing every factor that
// moved the rate.
//
// SPEC-GRADE: real (deterministic) logic with the factor shape a CU
// underwriter would recognize. Production replaces the bodies with the
// bank's actual decisioning engine. Interface and rationale-emission pattern
// stay.

import type { Member } from "@/data/members";
import type { SkillExecutionResult, LoanOffer } from "@/lib/types";

export const SKILL_ID = "skill-loan-decisioning";
export const ADAPTER_NAME = "EltropyDecisioningRulesV2";

export type LoanDecisioningInputs = {
  member: Member;
  ficoFromBureau: number;
  amount: number;
  termMonths: number;
  productType: "auto_loan" | "mortgage" | "heloc" | "personal_loan";
  vehicleYear?: number;
  existingLoanApr?: number;
};

export type LoanDecisioningOutputs = {
  offer: LoanOffer;
};

const PRODUCT_CAPS: Record<LoanDecisioningInputs["productType"], number> = {
  auto_loan: 75_000,
  heloc: 250_000,
  mortgage: 1_500_000,
  personal_loan: 25_000,
};

const CURRENT_YEAR = new Date().getFullYear();

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

function getTenureAdjustment(tenureYears: number): number {
  if (tenureYears >= 5) return -0.5;
  if (tenureYears >= 2) return -0.25;
  return 0;
}

// Cross-sell loyalty: members with 5+ active products earn a small relationship discount.
// Gated at 5 so the existing 4-product Michael Tanaka demo stays at 5.99% APR.
function getCrossSellAdjustment(productCount: number): number {
  return productCount >= 5 ? -0.25 : 0;
}

// Estimate vehicle value: new-car baseline minus straight-line depreciation,
// floored. Real-world this would call Black Book or NADA via an adapter.
function estimateVehicleValue(year: number): number {
  const age = Math.max(0, CURRENT_YEAR - year);
  const baseline = 35_000;
  const perYear = 2_800;
  return Math.max(5_000, baseline - age * perYear);
}

function computeMonthlyPayment(
  principal: number,
  aprPercent: number,
  termMonths: number,
): number {
  const r = aprPercent / 100 / 12;
  if (r === 0) return principal / termMonths;
  const m =
    (principal * r * Math.pow(1 + r, termMonths)) /
    (Math.pow(1 + r, termMonths) - 1);
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
  const crossSellAdj = getCrossSellAdjustment(inputs.member.products.length);

  // --- Tentative APR before DTI/LTV checks ---
  const tentativeApr = Math.max(
    0,
    rateBand.baseApr + tenureAdj + crossSellAdj,
  );
  const tentativeMonthly =
    rateBand.band === "declined"
      ? 0
      : computeMonthlyPayment(inputs.amount, tentativeApr, inputs.termMonths);

  // --- DTI calculation (existing debts + new loan payment) ---
  const income = inputs.member.monthlyIncome;
  const existingDebts = inputs.member.monthlyDebts;
  const dtiFraction =
    income > 0 ? (existingDebts + tentativeMonthly) / income : 1;
  const dtiPct = dtiFraction * 100;

  // --- LTV calculation (auto loans only, when vehicleYear is known) ---
  let ltvPct: number | undefined;
  let vehicleValue: number | undefined;
  if (inputs.productType === "auto_loan" && inputs.vehicleYear) {
    vehicleValue = estimateVehicleValue(inputs.vehicleYear);
    ltvPct = (inputs.amount / vehicleValue) * 100;
  }

  // --- Decline gates ---
  if (rateBand.band === "declined") {
    return makeDeclinedResult({
      ...inputs,
      startedAt,
      start,
      offer: {
        approved: false,
        amount: inputs.amount,
        termMonths: inputs.termMonths,
        apr: 0,
        monthlyPayment: 0,
        rateBand: "declined",
        rationale: `FICO ${inputs.ficoFromBureau} is below the 620 minimum threshold. Routed to credit counseling and secured-card pre-approval queue.`,
        disclosure: "",
      },
    });
  }

  if (inputs.amount > cap) {
    return makeDeclinedResult({
      ...inputs,
      startedAt,
      start,
      offer: {
        approved: false,
        amount: inputs.amount,
        termMonths: inputs.termMonths,
        apr: 0,
        monthlyPayment: 0,
        rateBand: rateBand.band,
        rationale: `Requested $${inputs.amount.toLocaleString()} exceeds the ${inputs.productType.replace("_", " ")} product cap of $${cap.toLocaleString()}. Routed to manual underwriting (commercial lending team).`,
        disclosure: "",
      },
    });
  }

  if (dtiPct > 50) {
    return makeDeclinedResult({
      ...inputs,
      startedAt,
      start,
      offer: {
        approved: false,
        amount: inputs.amount,
        termMonths: inputs.termMonths,
        apr: 0,
        monthlyPayment: 0,
        rateBand: rateBand.band,
        rationale: `Projected DTI ${dtiPct.toFixed(0)}% exceeds the 50% hard ceiling once this loan is added. Existing debt service $${existingDebts.toLocaleString()}/mo against $${income.toLocaleString()}/mo income leaves insufficient capacity. Officer to discuss budgeting and a smaller principal.`,
        disclosure: "",
      },
    });
  }

  if (ltvPct !== undefined && ltvPct > 150) {
    return makeDeclinedResult({
      ...inputs,
      startedAt,
      start,
      offer: {
        approved: false,
        amount: inputs.amount,
        termMonths: inputs.termMonths,
        apr: 0,
        monthlyPayment: 0,
        rateBand: rateBand.band,
        rationale: `Loan-to-value ${ltvPct.toFixed(0)}% (vehicle est. $${vehicleValue!.toLocaleString()}) exceeds the 150% over-borrow ceiling for auto collateral. Officer to discuss down payment or shorter term.`,
        disclosure: "",
      },
    });
  }

  // --- Risk adjustments ---
  let finalApr = tentativeApr;
  const adjustmentFactors: string[] = [];

  if (dtiPct > 36) {
    finalApr += 0.5;
    adjustmentFactors.push(
      `+0.50% DTI overlay (${dtiPct.toFixed(0)}% > 36% comfort line)`,
    );
  }
  if (ltvPct !== undefined && ltvPct > 120) {
    finalApr += 0.75;
    adjustmentFactors.push(
      `+0.75% LTV overlay (${ltvPct.toFixed(0)}% > 120%)`,
    );
  }

  finalApr = Math.round(finalApr * 100) / 100;
  const monthly = computeMonthlyPayment(
    inputs.amount,
    finalApr,
    inputs.termMonths,
  );

  // --- Build rationale ---
  const factors: string[] = [];
  factors.push(
    `FICO ${inputs.ficoFromBureau} → ${rateBand.band} band (base ${rateBand.baseApr.toFixed(2)}%)`,
  );
  if (tenureAdj !== 0) {
    factors.push(
      `${inputs.member.tenureYears.toFixed(1)}y member tenure → ${tenureAdj.toFixed(2)}%`,
    );
  }
  if (crossSellAdj !== 0) {
    factors.push(
      `${inputs.member.products.length}-product relationship → ${crossSellAdj.toFixed(2)}% loyalty discount`,
    );
  }
  factors.push(
    `DTI ${dtiPct.toFixed(0)}% ($${existingDebts.toLocaleString()} existing + $${monthly.toFixed(0)} new vs $${income.toLocaleString()} income)${dtiPct > 36 ? " — flagged" : " — within comfort"}`,
  );
  if (ltvPct !== undefined) {
    factors.push(
      `LTV ${ltvPct.toFixed(0)}% (est. vehicle value $${vehicleValue!.toLocaleString()})${ltvPct > 120 ? " — flagged" : ""}`,
    );
  }
  if (adjustmentFactors.length > 0) {
    factors.push(`Risk overlays: ${adjustmentFactors.join(", ")}`);
  }
  factors.push(
    `Final APR ${finalApr.toFixed(2)}% on a ${inputs.termMonths}-month ${inputs.productType.replace("_", " ")}, monthly payment $${monthly.toFixed(2)}`,
  );

  const offer: LoanOffer = {
    approved: true,
    amount: inputs.amount,
    termMonths: inputs.termMonths,
    apr: finalApr,
    monthlyPayment: monthly,
    rateBand: rateBand.band,
    rationale: factors.join(". ") + ".",
    disclosure: `Truth-in-Lending: APR ${finalApr.toFixed(2)}%, finance charge over term $${(monthly * inputs.termMonths - inputs.amount).toFixed(2)}, total of payments $${(monthly * inputs.termMonths).toFixed(2)}. Subject to verification of stated income and collateral.`,
  };

  return {
    skillId: SKILL_ID,
    status: "completed",
    startedAt,
    completedAt: new Date().toISOString(),
    durationMs: Math.round(performance.now() - start),
    inputs: {
      memberId: inputs.member.id,
      fico: inputs.ficoFromBureau,
      amount: inputs.amount,
      termMonths: inputs.termMonths,
      productType: inputs.productType,
      dtiPct: Math.round(dtiPct),
      ltvPct: ltvPct !== undefined ? Math.round(ltvPct) : undefined,
      vehicleValue,
    },
    adapter: ADAPTER_NAME,
    outputs: { offer },
    rationale: offer.rationale,
  };
}

function makeDeclinedResult(args: {
  member: Member;
  ficoFromBureau: number;
  amount: number;
  termMonths: number;
  productType: LoanDecisioningInputs["productType"];
  startedAt: string;
  start: number;
  offer: LoanOffer;
}): SkillExecutionResult<LoanDecisioningOutputs> {
  return {
    skillId: SKILL_ID,
    status: "completed",
    startedAt: args.startedAt,
    completedAt: new Date().toISOString(),
    durationMs: Math.round(performance.now() - args.start),
    inputs: {
      memberId: args.member.id,
      fico: args.ficoFromBureau,
      amount: args.amount,
      termMonths: args.termMonths,
      productType: args.productType,
    },
    adapter: ADAPTER_NAME,
    outputs: { offer: args.offer },
    rationale: args.offer.rationale,
  };
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// lib/skills/account-summary.ts
//
// Skill: Account Summary
// Returns the member's account balances, credit utilization, and last 5
// transactions. Mock: derived from data/members.ts product entries plus
// synthesized recent transactions. Production calls Symitar SymXchange.

import type { Member } from "@/data/members";
import type {
  SkillExecutionResult,
  AccountSummary,
} from "@/lib/types";

export const SKILL_ID = "skill-account-summary";
export const ADAPTER_NAME = "SymitarSymXchange-mock";

export type AccountSummaryInputs = {
  member: Member;
  accountTypeFilter?: string;
};

export type AccountSummaryOutputs = {
  summary: AccountSummary;
};

export async function executeAccountSummary(
  inputs: AccountSummaryInputs,
): Promise<SkillExecutionResult<AccountSummaryOutputs>> {
  const startedAt = new Date().toISOString();
  const start = performance.now();
  await wait(280 + Math.random() * 180);

  const filter = inputs.accountTypeFilter;
  const wanted = inputs.member.products.filter((p) => {
    if (!filter || filter === "all") return true;
    return p.type === filter;
  });

  const accounts = wanted.map((p) => ({
    type: p.type,
    accountId: p.accountId,
    balance: p.balance ?? 0,
    lastActivity: syntheticLastActivity(p.accountId),
  }));

  const totalDeposits = wanted
    .filter((p) => ["checking", "savings", "money_market"].includes(p.type))
    .reduce((acc, p) => acc + (p.balance ?? 0), 0);
  const totalCredit = wanted
    .filter((p) => p.type === "credit_card")
    .reduce((acc, p) => acc + (p.balance ?? 0), 0);

  const recentTransactions = synthesizeRecentTransactions(wanted);

  const summary: AccountSummary = {
    asOf: new Date().toISOString(),
    accounts,
    totalDeposits,
    totalCredit,
    recentTransactions,
    rationale: `Retrieved ${accounts.length} account${accounts.length === 1 ? "" : "s"} for member ${inputs.member.id}. Total deposits $${totalDeposits.toFixed(2)} across share accounts; credit card balance $${totalCredit.toFixed(2)}. Last 5 transactions surfaced.`,
  };

  return {
    skillId: SKILL_ID,
    status: "completed",
    startedAt,
    completedAt: new Date().toISOString(),
    durationMs: Math.round(performance.now() - start),
    inputs: {
      memberId: inputs.member.id,
      filter: filter ?? "all",
    },
    adapter: ADAPTER_NAME,
    outputs: { summary },
    rationale: summary.rationale,
  };
}

function syntheticLastActivity(accountId: string): string {
  // Deterministic-ish recent date based on accountId hash so the same
  // account looks consistent across demo runs.
  const seed = accountId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const daysAgo = (seed % 5) + 1;
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

const SAMPLE_DEBITS = [
  { description: "STARBUCKS #4218", amount: 6.45 },
  { description: "AMAZON.COM*A1B2C3", amount: 38.92 },
  { description: "SHELL OIL 0917", amount: 47.18 },
  { description: "WHOLE FOODS MKT", amount: 92.34 },
  { description: "NETFLIX.COM", amount: 15.99 },
];

function synthesizeRecentTransactions(
  products: Member["products"],
): AccountSummary["recentTransactions"] {
  const checkingOrSavings = products.find((p) =>
    ["checking", "savings"].includes(p.type),
  );
  if (!checkingOrSavings) return [];

  return SAMPLE_DEBITS.map((s, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (i + 1));
    return {
      date: d.toISOString().slice(0, 10),
      description: s.description,
      amount: -s.amount,
      accountId: checkingOrSavings.accountId,
    };
  });
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

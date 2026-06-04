// lib/twilio/preflight-transfer.ts
//
// Voice-layer preflight check for transfer requests. Runs inline during
// the call (in the confirm webhook) before any closing copy is spoken,
// so the member learns about insufficient funds or other blocks while
// they're still on the line — instead of after the call ends.
//
// Mirrors the same rules enforced by skill-transfer-policy-check (defense
// in depth lives there). The preflight returns natural-language messages
// suitable for Text-to-Speech readback.

import type { Member } from "@/data/members";

export const DAILY_LIMIT_USD = 50_000;
export const MIN_TRANSFER_AMOUNT_USD = 1;

export type PreflightBlockReason =
  | "min_amount"
  | "same_account"
  | "missing_source"
  | "missing_destination"
  | "insufficient_funds"
  | "daily_limit";

export type PreflightResult =
  | { allowed: true }
  | {
      allowed: false;
      reason: PreflightBlockReason;
      message: string;
      details: Record<string, unknown>;
    };

export function preflightTransfer(
  member: Member,
  amount: number,
  fromAccountType: string,
  toAccountType: string,
): PreflightResult {
  if (!Number.isFinite(amount) || amount < MIN_TRANSFER_AMOUNT_USD) {
    return {
      allowed: false,
      reason: "min_amount",
      message: "the amount needs to be at least one dollar.",
      details: { amount },
    };
  }

  if (fromAccountType === toAccountType) {
    return {
      allowed: false,
      reason: "same_account",
      message: `the source and destination accounts can't both be your ${humanAccount(fromAccountType)}.`,
      details: { fromAccountType, toAccountType },
    };
  }

  const from = member.products.find((p) => p.type === fromAccountType);
  if (!from) {
    return {
      allowed: false,
      reason: "missing_source",
      message: `I don't see a ${humanAccount(fromAccountType)} account on your profile.`,
      details: { fromAccountType },
    };
  }

  const to = member.products.find((p) => p.type === toAccountType);
  if (!to) {
    return {
      allowed: false,
      reason: "missing_destination",
      message: `I don't see a ${humanAccount(toAccountType)} account on your profile to transfer into.`,
      details: { toAccountType },
    };
  }

  const available = from.balance ?? 0;
  if (available < amount) {
    return {
      allowed: false,
      reason: "insufficient_funds",
      message: `you don't have enough in your ${humanAccount(fromAccountType)} account for that transfer. Your current available balance is ${spellMoney(available)}.`,
      details: { available, requested: amount, accountType: fromAccountType },
    };
  }

  if (amount > DAILY_LIMIT_USD) {
    return {
      allowed: false,
      reason: "daily_limit",
      message: `that amount exceeds our daily transfer limit of ${spellMoney(DAILY_LIMIT_USD)}.`,
      details: { limit: DAILY_LIMIT_USD, requested: amount },
    };
  }

  return { allowed: true };
}

function humanAccount(type: string): string {
  return type.replace(/_/g, " ");
}

function spellMoney(amount: number): string {
  // Twilio's Polly TTS reads "$12,840.30" as "twelve thousand eight
  // hundred forty dollars and thirty cents" — leave it formatted.
  return `$${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

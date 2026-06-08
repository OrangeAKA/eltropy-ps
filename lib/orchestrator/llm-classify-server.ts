// lib/orchestrator/llm-classify-server.ts
//
// Server-only intent classifier. Used by the /api/classify-intent route
// (browser-driven path) AND the /api/voice/* webhooks (Twilio path).
//
// Returns either a successful classification or null on any failure.
// Callers decide whether to fall back to a keyword classifier.

import Anthropic from "@anthropic-ai/sdk";
import type { IntentClassification, IntentName, IntentEntities } from "@/lib/types";

const MODEL = "claude-haiku-4-5-20251001";
const CLASSIFIER_ID = "claude-haiku-4-5";

// Fields the IVR treats as numeric. Claude usually returns these as
// numbers, but occasionally serializes them as strings ("1000", "$1,500"),
// which breaks downstream `typeof v === "number"` checks and causes the
// slot-fill loop to run forever on a perfectly fine extraction. We
// normalize at the boundary so the rest of the system can trust the type.
const INTEGER_FIELDS = new Set([
  "amount",
  "existing_balance",
  "vehicle_year",
  "term_months",
]);
const FLOAT_FIELDS = new Set(["existing_apr"]);

function coerceNumericFields(
  entities: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(entities)) {
    const isInt = INTEGER_FIELDS.has(k);
    const isFloat = FLOAT_FIELDS.has(k);
    if (typeof v === "string" && (isInt || isFloat)) {
      const cleaned = v.replace(/[^0-9.]/g, "");
      const parsed = parseFloat(cleaned);
      if (!isNaN(parsed) && parsed > 0) {
        out[k] = isInt ? Math.round(parsed) : parsed;
        continue;
      }
    }
    out[k] = v;
  }
  return out;
}

const SYSTEM_PROMPT = `You are an intent classifier for a US credit union's member-service AI orchestrator. Classify the inbound member message into ONE of these intents:

- lending_inquiry: Member wants a NEW loan (auto, mortgage, HELOC, personal, etc.)
- refinance_inquiry: Member wants to refinance an EXISTING loan
- card_dispute: Member wants to dispute a charge, report fraud, or block a card
- balance_inquiry: Member is asking about their account balance or recent transactions
- transfer_funds: Member wants to MOVE money between their own accounts (savings ↔ checking, etc.) or to another member
- general_handoff: Anything else, unclear, or out of scope

Also extract relevant entities (only include keys with confident values):

Common:
- amount: dollar amount as integer (e.g., 25000 for "$25K" or "twenty-five thousand")
- account_type: "checking" | "savings" | "money_market" | "credit_card" | "all" (for balance_inquiry only)

Lending / refinance:
- product: "auto_loan" | "mortgage" | "heloc" | "credit_card" | "personal_loan"
- vehicle: full vehicle description if mentioned (e.g., "2024 Honda CR-V")
- vehicle_year: integer 4-digit year if a vehicle year is mentioned (e.g., 2024)
- existing_balance: existing loan balance as integer if mentioned
- existing_apr: existing loan APR as a number if mentioned (e.g., 7.5)
- term_months: loan term in months if mentioned (assume 60 if "5 years", 72 if "6 years")

Card dispute:
- merchant: merchant name as it appears on the statement, if mentioned (e.g., "TICKETLY*GHOST")
- transaction_date: ISO date or natural-language reference if given (e.g., "last Tuesday", "2026-05-21")
- card_last4: last 4 digits of card if mentioned

Transfer funds:
- from_account_type: "savings" | "checking" | "money_market" — source
- to_account_type: "savings" | "checking" | "money_market" — destination

Confidence is your assessment from 0.0 to 1.0.

Return ONLY a single valid JSON object on one line, no preamble, no markdown:
{"intent": "...", "confidence": 0.95, "entities": {...}}`;

export async function classifyIntentServer(
  messageBody: string,
): Promise<IntentClassification | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  const trimmed = messageBody.trim();
  if (!trimmed) return null;

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 256,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: trimmed }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") return null;

    const raw = textBlock.text.trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    let parsed: {
      intent?: string;
      confidence?: number;
      entities?: Record<string, unknown>;
    };
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      return null;
    }

    return {
      intent: normalizeIntent(parsed.intent),
      confidence:
        typeof parsed.confidence === "number" ? parsed.confidence : 0.85,
      entities: coerceNumericFields(parsed.entities ?? {}) as IntentEntities,
      classifier: CLASSIFIER_ID,
    };
  } catch (err) {
    console.warn("[llm-classify-server] Anthropic API error:", err);
    return null;
  }
}

function normalizeIntent(raw?: string): IntentName {
  const allowed: IntentName[] = [
    "lending_inquiry",
    "refinance_inquiry",
    "card_dispute",
    "balance_inquiry",
    "transfer_funds",
    "general_handoff",
  ];
  if (raw && (allowed as string[]).includes(raw)) return raw as IntentName;
  return "general_handoff";
}

// ────────────────────────────────────────────────────────────────────────────
// Slot extraction — used by the voice IVR when re-prompting the member
// for a missing field (e.g. "How much would you like to transfer?")
//
// Returns the merged entities map, preserving anything we already knew
// and overlaying anything the model could pull from the new utterance.
// ────────────────────────────────────────────────────────────────────────────

const SLOT_EXTRACT_SYSTEM = `You are a slot-extraction assistant for a US credit union's member-service AI. The member's primary intent is already known. Your job is to extract the SPECIFIC named fields from a short follow-up utterance.

Allowed fields and their formats:
- amount: dollar amount as a positive integer (e.g., 1500 for "fifteen hundred" or "$1,500")
- from_account_type: "savings" | "checking" | "money_market"
- to_account_type: "savings" | "checking" | "money_market"
- merchant: a merchant name as it appears on a statement
- transaction_date: ISO date or natural-language date reference
- card_last4: last 4 digits of a card
- product: "auto_loan" | "mortgage" | "heloc" | "credit_card" | "personal_loan"
- vehicle_year: 4-digit integer year
- term_months: integer months (assume 60 for "5 years", 72 for "6 years")

Return ONLY a JSON object containing the fields you can confidently extract from the utterance. Omit any field you cannot extract with confidence. Do not invent values. If the utterance does not contain any of the requested fields, return {}.

Return raw JSON only, no preamble, no markdown.`;

export async function extractSlotsServer(args: {
  utterance: string;
  intent: IntentName;
  missingSlots: string[];
  knownEntities: Record<string, unknown>;
}): Promise<Record<string, unknown>> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return {};
  const trimmed = args.utterance.trim();
  if (!trimmed) return {};

  const client = new Anthropic({ apiKey });

  const userPrompt = `Intent: ${args.intent}
Already known: ${JSON.stringify(args.knownEntities)}
Missing fields: ${args.missingSlots.join(", ")}
Member said: "${trimmed}"

Extract any of the missing fields you can confidently identify in the utterance.`;

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 200,
      system: SLOT_EXTRACT_SYSTEM,
      messages: [{ role: "user", content: userPrompt }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") return {};

    const raw = textBlock.text.trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return {};

    try {
      const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
      return coerceNumericFields(parsed);
    } catch {
      return {};
    }
  } catch (err) {
    console.warn("[llm-classify-server] slot extraction error:", err);
    return {};
  }
}

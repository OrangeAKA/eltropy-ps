// app/api/classify-intent/route.ts
//
// Serverless route: takes a member message body, calls Claude Haiku 4.5 to
// classify the intent + extract entities, returns a structured response that
// matches the IntentClassification type used by the orchestrator.
//
// Falls back gracefully: if ANTHROPIC_API_KEY is missing or the model fails,
// returns a 503. The client-side intent-classifier.ts catches that and falls
// back to the deterministic keyword classifier so the demo never breaks.

import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

const MODEL = "claude-haiku-4-5-20251001";
const CLASSIFIER_ID = `claude-haiku-4-5`;

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

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY not configured on server" },
      { status: 503 },
    );
  }

  let body: { body?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const messageBody = (body.body ?? "").trim();
  if (!messageBody) {
    return Response.json({ error: "Empty message body" }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 256,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: messageBody }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return Response.json(
        { error: "No text content returned from model" },
        { status: 502 },
      );
    }

    // The model is instructed to return raw JSON; defensively extract the
    // first {...} block in case it wraps it in markdown anyway.
    const raw = textBlock.text.trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return Response.json(
        { error: "No JSON object in model response", raw },
        { status: 502 },
      );
    }

    let parsed: {
      intent?: string;
      confidence?: number;
      entities?: Record<string, unknown>;
    };
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      return Response.json(
        { error: "Failed to parse model JSON", raw },
        { status: 502 },
      );
    }

    return Response.json({
      intent: parsed.intent ?? "general_handoff",
      confidence:
        typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
      entities: parsed.entities ?? {},
      classifier: CLASSIFIER_ID,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json(
      { error: `Anthropic API error: ${message}` },
      { status: 502 },
    );
  }
}

// lib/orchestrator/intent-classifier.ts
//
// Classifies a free-text message body into a structured intent + entities.
//
// Primary implementation: calls the /api/classify-intent serverless route
// which uses Claude Haiku 4.5 for real LLM-backed classification.
//
// Fallback implementation: deterministic keyword heuristics. Fires when:
//   - The LLM route returns non-200 (e.g., ANTHROPIC_API_KEY missing)
//   - The fetch fails (network error, offline dev)
//   - The model returns malformed output
//
// This means the demo never breaks. Production keeps both layers — the
// fallback is a safety net for outages.

import type { IntentClassification, IntentName, IntentEntities } from "@/lib/types";

export const PRIMARY_CLASSIFIER = "claude-haiku-4-5";
export const FALLBACK_CLASSIFIER = "KeywordHeuristicMock-v1";

export async function classifyIntent(body: string): Promise<IntentClassification> {
  // ── 1. Try the LLM-backed route
  try {
    const response = await fetch("/api/classify-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });

    if (response.ok) {
      const data = (await response.json()) as {
        intent?: string;
        confidence?: number;
        entities?: Record<string, unknown>;
        classifier?: string;
      };
      const intent = normalizeIntent(data.intent);
      return {
        intent,
        confidence: typeof data.confidence === "number" ? data.confidence : 0.85,
        entities: (data.entities ?? {}) as IntentEntities,
        classifier: data.classifier ?? PRIMARY_CLASSIFIER,
      };
    }

    // Non-OK response: log and fall through to keyword
    console.warn(
      `[intent-classifier] LLM route returned ${response.status}; falling back to keyword classifier`,
    );
  } catch (err) {
    console.warn(
      "[intent-classifier] LLM route fetch failed; falling back to keyword classifier:",
      err,
    );
  }

  // ── 2. Fallback: deterministic keyword classifier
  return keywordClassify(body);
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
// Fallback: deterministic keyword classifier
// ────────────────────────────────────────────────────────────────────────────

async function keywordClassify(body: string): Promise<IntentClassification> {
  await wait(120 + Math.random() * 80);

  const lower = body.toLowerCase();
  const intent = detectIntent(lower);
  const entities = extractEntities(lower);
  const confidence = computeConfidence(lower, intent);

  return { intent, entities, confidence, classifier: FALLBACK_CLASSIFIER };
}

function detectIntent(body: string): IntentName {
  if (
    /(transfer|move (some )?(money|funds)|send (money|funds)|move \$|from (my )?(savings|checking) (to|into))/i.test(
      body,
    )
  ) {
    return "transfer_funds";
  }
  if (
    /(refi|refinance|lower (my )?rate|reduce (my )?payment|lower monthly)/i.test(body)
  ) {
    return "refinance_inquiry";
  }
  if (
    /(loan|finance|borrow|auto|car|honda|toyota|ford|truck|suv|mortgage|heloc)/i.test(
      body,
    )
  ) {
    return "lending_inquiry";
  }
  if (/(dispute|fraud|charge|unauthorized|i didn'?t)/i.test(body)) {
    return "card_dispute";
  }
  if (/(balance|how much|account total)/i.test(body)) {
    return "balance_inquiry";
  }
  return "general_handoff";
}

function extractEntities(body: string): IntentEntities {
  const entities: IntentEntities = {};

  const dollarMatch = body.match(/\$?\s*(\d{1,3}(?:,\d{3})*|\d+)\s*(k|grand|thousand)?/i);
  if (dollarMatch) {
    let amount = parseInt(dollarMatch[1].replace(/,/g, ""), 10);
    if (dollarMatch[2] && /^(k|grand|thousand)$/i.test(dollarMatch[2])) {
      amount *= 1000;
    }
    if (amount >= 1000 && amount <= 1_000_000) {
      entities.amount = amount;
    }
  }

  const vehicleMatch = body.match(
    /(20\d{2})\s+(honda|toyota|ford|chevy|chevrolet|nissan|hyundai|kia|mazda|subaru|jeep)\s+([a-z\-]+)/i,
  );
  if (vehicleMatch) {
    entities.vehicle = `${vehicleMatch[1]} ${vehicleMatch[2]} ${vehicleMatch[3]}`;
  }

  if (/auto|car|truck|suv|honda|toyota|ford/i.test(body)) {
    entities.product = "auto_loan";
  } else if (/mortgage|home/i.test(body)) {
    entities.product = "mortgage";
  } else if (/heloc|equity/i.test(body)) {
    entities.product = "heloc";
  }

  const fromMatch = body.match(
    /from\s+(?:my\s+)?(savings|checking|money[\s-]?market)/i,
  );
  if (fromMatch) {
    entities.from_account_type = normalizeAccountType(fromMatch[1]);
  }
  const toMatch = body.match(
    /(?:to|into)\s+(?:my\s+)?(savings|checking|money[\s-]?market)/i,
  );
  if (toMatch) {
    entities.to_account_type = normalizeAccountType(toMatch[1]);
  }

  return entities;
}

function normalizeAccountType(raw: string): string {
  const t = raw.toLowerCase().replace(/[\s-]/g, "_");
  if (t.startsWith("money")) return "money_market";
  return t;
}

function computeConfidence(body: string, intent: IntentName): number {
  const hits = body.match(/(loan|finance|refi|refinance|auto|mortgage|dispute|balance)/gi);
  const base = hits ? Math.min(0.99, 0.7 + hits.length * 0.07) : 0.55;
  if (intent === "general_handoff") return 0.42;
  return Math.round(base * 100) / 100;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

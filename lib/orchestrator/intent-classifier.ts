// lib/orchestrator/intent-classifier.ts
//
// Classifies a free-text message body into a structured intent + entities.
// Mock implementation uses keyword heuristics. Production swaps in an
// LLM-backed classifier (Claude Haiku, GPT-4o-mini, etc.) with the same
// interface.

import type { IntentClassification, IntentName, IntentEntities } from "@/lib/types";

export const CLASSIFIER_NAME = "KeywordHeuristicMock-v1";

// Production replacement: pass body to LLM with structured output schema.
export async function classifyIntent(body: string): Promise<IntentClassification> {
  await wait(160 + Math.random() * 120);

  const lower = body.toLowerCase();
  const intent = detectIntent(lower);
  const entities = extractEntities(lower);
  const confidence = computeConfidence(lower, intent);

  return {
    intent,
    entities,
    confidence,
    classifier: CLASSIFIER_NAME,
  };
}

function detectIntent(body: string): IntentName {
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

  // Dollar amount: $25K, $25,000, twenty-five thousand
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

  // Vehicle (very rough): year + make
  const vehicleMatch = body.match(
    /(20\d{2})\s+(honda|toyota|ford|chevy|chevrolet|nissan|hyundai|kia|mazda|subaru|jeep)\s+([a-z\-]+)/i,
  );
  if (vehicleMatch) {
    entities.vehicle = `${vehicleMatch[1]} ${vehicleMatch[2]} ${vehicleMatch[3]}`;
  }

  // Product guess from keywords
  if (/auto|car|truck|suv|honda|toyota|ford/i.test(body)) {
    entities.product = "auto_loan";
  } else if (/mortgage|home/i.test(body)) {
    entities.product = "mortgage";
  } else if (/heloc|equity/i.test(body)) {
    entities.product = "heloc";
  }

  return entities;
}

function computeConfidence(body: string, intent: IntentName): number {
  // Mock heuristic: more keyword matches → higher confidence
  const hits = body.match(/(loan|finance|refi|refinance|auto|mortgage|dispute|balance)/gi);
  const base = hits ? Math.min(0.99, 0.7 + hits.length * 0.07) : 0.55;
  if (intent === "general_handoff") return 0.42;
  return Math.round(base * 100) / 100;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

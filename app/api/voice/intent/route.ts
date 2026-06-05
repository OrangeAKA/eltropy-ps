// app/api/voice/intent/route.ts
//
// Two responsibilities:
//   1. First-pass intent classification on the open-ended speech prompt.
//   2. Slot-filling: if the LLM-extracted entities are missing required
//      fields (e.g., transfer amount), re-prompt the member via speech,
//      extract the missing slots from the response, and loop until all
//      slots are filled or we hit MAX_SLOT_FILL_ATTEMPTS.
//
// This is the guardrail that prevents the system from ever proceeding
// with an incomplete request — no $0 transfers, no transfers without
// a destination, etc. The policy check skill catches it as defense in
// depth, but we want the member to get a natural follow-up question
// instead of an opaque rejection.

import { NextRequest } from "next/server";
import twilio from "twilio";
import { getCallState, upsertCallState } from "@/lib/twilio/call-state";
import { pushVoiceEvent } from "@/lib/twilio/live-events";
import {
  classifyIntentServer,
  extractSlotsServer,
} from "@/lib/orchestrator/llm-classify-server";
import type { IntentClassification, IntentEntities, IntentName } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SLOT_FILL_ATTEMPTS = 2;

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const callSid = (form.get("CallSid") as string) ?? "";
  const transcript = ((form.get("SpeechResult") as string) ?? "").trim();

  const response = new twilio.twiml.VoiceResponse();
  const state = getCallState(callSid);

  if (!state || !state.selectedMemberPhone) {
    response.say(
      { voice: "Polly.Joanna" },
      "It looks like the call has timed out. Please call us back and we'll pick up where we left off.",
    );
    response.hangup();
    return new Response(response.toString(), {
      headers: { "Content-Type": "text/xml" },
    });
  }

  if (!transcript) {
    // Twilio captured no speech; one polite retry then escalate.
    const retryGather = response.gather({
      input: ["speech"],
      action: "/api/voice/intent",
      method: "POST",
      speechTimeout: "auto",
      language: "en-US",
      timeout: 10,
    });
    retryGather.say(
      { voice: "Polly.Joanna" },
      "Sorry, I didn't quite catch that. Could you tell me again, in a few words, how I can help?",
    );
    response.say(
      { voice: "Polly.Joanna" },
      "Let me get a member services officer to help. Please hold.",
    );
    response.hangup();
    return new Response(response.toString(), {
      headers: { "Content-Type": "text/xml" },
    });
  }

  // ── Determine whether this is the FIRST classification pass or a
  //    slot-fill response on an existing intent.
  let intent: IntentClassification;
  if (state.intent) {
    // Slot-fill iteration: we already know the intent; extract just the
    // missing slots from the new utterance.
    const known = state.intent.entities;
    const missing = missingSlotsFor(state.intent.intent, known);
    const newSlots = await extractSlotsServer({
      utterance: transcript,
      intent: state.intent.intent,
      missingSlots: missing,
      knownEntities: known,
    });
    const mergedEntities: IntentEntities = {
      ...known,
      ...sanitizeSlots(newSlots),
    };
    intent = {
      ...state.intent,
      entities: mergedEntities,
    };
  } else {
    // First pass: full intent classification.
    const classified = await classifyIntentServer(transcript);
    intent =
      classified ?? {
        intent: "general_handoff",
        confidence: 0.4,
        entities: {},
        classifier: "fallback",
      };
  }

  upsertCallState(callSid, { transcript, intent });

  // Surface the classifier result to Mission Control so the cockpit
  // shows the captured intent while the member is still on the call.
  // Emits on every classification pass (including slot-fill iterations)
  // so MC reflects the latest understanding of what the member wants.
  pushVoiceEvent({
    type: "intent_captured",
    callSid,
    timestamp: Date.now(),
    intent: intent.intent,
    entities: intent.entities,
    confidence: intent.confidence,
  });

  // ── Check whether required slots are filled.
  const missing = missingSlotsFor(intent.intent, intent.entities);

  if (missing.length > 0) {
    const attempts = state.slotFillAttempts ?? 0;
    if (attempts >= MAX_SLOT_FILL_ATTEMPTS) {
      // Give up gracefully — route to officer.
      response.say(
        { voice: "Polly.Joanna" },
        "I'm having a hard time hearing the details clearly. Let me get a member services officer to help you with this. Please hold.",
      );
      response.hangup();
      return new Response(response.toString(), {
        headers: { "Content-Type": "text/xml" },
      });
    }

    upsertCallState(callSid, { slotFillAttempts: attempts + 1 });

    const prompt = promptForMissingSlots(intent.intent, missing, intent.entities);
    const slotGather = response.gather({
      input: ["speech"],
      action: "/api/voice/intent",
      method: "POST",
      speechTimeout: "auto",
      language: "en-US",
      timeout: 10,
    });
    slotGather.say({ voice: "Polly.Joanna" }, prompt);

    response.say(
      { voice: "Polly.Joanna" },
      "I didn't catch a response. Let me get a member services officer to help. Please hold.",
    );
    response.hangup();
    return new Response(response.toString(), {
      headers: { "Content-Type": "text/xml" },
    });
  }

  // ── All required slots are present — read back + confirm.
  const readback = readbackText(intent);
  response.say({ voice: "Polly.Joanna" }, `Just to confirm — ${readback}`);
  response.pause({ length: 1 });

  const confirmGather = response.gather({
    numDigits: 1,
    action: "/api/voice/confirm",
    method: "POST",
    timeout: 8,
  });
  confirmGather.say(
    { voice: "Polly.Joanna" },
    "Press 1 if that's right, or press 2 to start over.",
  );

  response.say(
    { voice: "Polly.Joanna" },
    "I didn't hear a response. Let me get a member services officer to help. Please hold.",
  );
  response.hangup();

  return new Response(response.toString(), {
    headers: { "Content-Type": "text/xml" },
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Slot definitions
// ────────────────────────────────────────────────────────────────────────────

function missingSlotsFor(
  intent: IntentName,
  entities: Record<string, unknown>,
): string[] {
  const missing: string[] = [];
  const amount = entities.amount;
  const from = entities.from_account_type;
  const to = entities.to_account_type;
  const merchant = entities.merchant;

  switch (intent) {
    case "transfer_funds":
      if (typeof amount !== "number" || amount <= 0) missing.push("amount");
      if (typeof from !== "string" || from.length === 0) missing.push("from_account_type");
      if (typeof to !== "string" || to.length === 0) missing.push("to_account_type");
      // Reject same source/destination
      if (
        typeof from === "string" &&
        typeof to === "string" &&
        from === to
      ) {
        missing.push("distinct_accounts");
      }
      return missing;

    case "lending_inquiry":
      if (typeof amount !== "number" || amount <= 0) missing.push("amount");
      return missing;

    case "card_dispute":
      // Need at least one of: amount, merchant, or a date — to find the txn
      if (
        (typeof amount !== "number" || amount <= 0) &&
        (typeof merchant !== "string" || merchant.length === 0) &&
        typeof entities.transaction_date !== "string"
      ) {
        missing.push("dispute_details");
      }
      return missing;

    default:
      return missing;
  }
}

function sanitizeSlots(slots: Record<string, unknown>): IntentEntities {
  const out: IntentEntities = {};
  for (const [k, v] of Object.entries(slots)) {
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
      out[k] = v;
    }
  }
  return out;
}

// ────────────────────────────────────────────────────────────────────────────
// Natural follow-up prompts
// ────────────────────────────────────────────────────────────────────────────

function promptForMissingSlots(
  intent: IntentName,
  missing: string[],
  known: Record<string, unknown>,
): string {
  if (intent === "transfer_funds") {
    if (missing.includes("distinct_accounts")) {
      return "The source and destination accounts can't be the same. Which two accounts would you like to transfer between? Say something like, from savings to checking.";
    }
    const wantsAmount = missing.includes("amount");
    const wantsFrom = missing.includes("from_account_type");
    const wantsTo = missing.includes("to_account_type");

    if (wantsAmount && wantsFrom && wantsTo) {
      return "I didn't catch all the details. Could you tell me how much you'd like to transfer, and between which accounts? Say something like, fifteen hundred dollars from savings to checking.";
    }
    if (wantsAmount && (wantsFrom || wantsTo)) {
      return "I missed a couple details. How much would you like to transfer, and between which accounts?";
    }
    if (wantsAmount) {
      return "How much would you like to transfer?";
    }
    if (wantsFrom && wantsTo) {
      return "Which accounts would you like to transfer between — savings, checking, or money market?";
    }
    if (wantsFrom) {
      const toAcct = known.to_account_type as string | undefined;
      return toAcct
        ? `Which account should the money come from, going into your ${toAcct}?`
        : "Which account would you like the money to come from — savings, checking, or money market?";
    }
    if (wantsTo) {
      const fromAcct = known.from_account_type as string | undefined;
      return fromAcct
        ? `Which account should the money go to, coming from your ${fromAcct}?`
        : "Which account should the money go to?";
    }
  }

  if (intent === "lending_inquiry") {
    return "About how much are you looking to borrow?";
  }

  if (intent === "card_dispute") {
    return "Could you give me a bit more detail about the charge — either the amount, the merchant name, or about when it happened?";
  }

  return "Could you tell me a little more about what you need?";
}

// ────────────────────────────────────────────────────────────────────────────
// Readback (only called when all required slots are present)
// ────────────────────────────────────────────────────────────────────────────

function readbackText(intent: IntentClassification): string {
  const e = intent.entities;
  const amount = typeof e.amount === "number" ? e.amount : undefined;
  const from = e.from_account_type as string | undefined;
  const to = e.to_account_type as string | undefined;
  const merchant = e.merchant as string | undefined;

  switch (intent.intent) {
    case "transfer_funds":
      // After slot-fill we're guaranteed amount, from, and to are present.
      return `you want to transfer ${spellAmount(amount!)} from your ${from} account to your ${to} account.`;

    case "balance_inquiry":
      return "you want to check your account balance.";

    case "card_dispute":
      if (amount && merchant) {
        return `you want to dispute a charge of ${spellAmount(amount)} at ${merchant}.`;
      }
      if (amount) return `you want to dispute a charge of ${spellAmount(amount)} on your card.`;
      if (merchant) return `you want to dispute a charge at ${merchant}.`;
      return "you want to dispute a charge on your card.";

    case "lending_inquiry":
      return `you're interested in a loan of about ${spellAmount(amount!)}.`;

    case "refinance_inquiry":
      return "you'd like to refinance an existing loan.";

    default:
      return `you'd like to speak with a member services officer. I'll get one for you.`;
  }
}

function spellAmount(n: number): string {
  return `$${n.toLocaleString("en-US")}`;
}

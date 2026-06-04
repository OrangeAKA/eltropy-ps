// app/api/voice/intent/route.ts
//
// Receives the speech transcript from the open-ended intent prompt, runs
// the LLM classifier server-side, stores the result in call state, reads
// the intent back to the member, and gathers a DTMF confirmation.
//
// This is the safety-net step — the member must explicitly press 1 to
// confirm the system understood them correctly before any workflow runs.

import { NextRequest } from "next/server";
import twilio from "twilio";
import { getCallState, upsertCallState } from "@/lib/twilio/call-state";
import { classifyIntentServer } from "@/lib/orchestrator/llm-classify-server";
import type { IntentClassification } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const callSid = (form.get("CallSid") as string) ?? "";
  const transcript = ((form.get("SpeechResult") as string) ?? "").trim();

  const response = new twilio.twiml.VoiceResponse();

  if (!transcript) {
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
    response.hangup();
    return new Response(response.toString(), {
      headers: { "Content-Type": "text/xml" },
    });
  }

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

  let intent: IntentClassification | null = await classifyIntentServer(transcript);
  if (!intent) {
    intent = {
      intent: "general_handoff",
      confidence: 0.4,
      entities: {},
      classifier: "fallback",
    };
  }

  upsertCallState(callSid, { transcript, intent });

  const readback = readbackText(intent, transcript);
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

function readbackText(intent: IntentClassification, transcript: string): string {
  const e = intent.entities;
  const amount = typeof e.amount === "number" ? e.amount : undefined;
  const from = e.from_account_type as string | undefined;
  const to = e.to_account_type as string | undefined;

  switch (intent.intent) {
    case "transfer_funds":
      if (amount && from && to) {
        return `you want to transfer ${spellAmount(amount)} from your ${from} account to your ${to} account.`;
      }
      if (amount) {
        return `you want to move ${spellAmount(amount)} between your accounts.`;
      }
      return "you want to transfer funds between your accounts.";

    case "balance_inquiry":
      return "you want to check your account balance.";

    case "card_dispute":
      if (amount) return `you want to dispute a charge of ${spellAmount(amount)} on your card.`;
      return "you want to dispute a charge on your card.";

    case "lending_inquiry":
      if (amount) return `you're interested in a loan of about ${spellAmount(amount)}.`;
      return "you're interested in applying for a new loan.";

    case "refinance_inquiry":
      return "you'd like to refinance an existing loan.";

    default:
      return `you said: "${transcript}". I'll get a member services officer to help with that.`;
  }
}

function spellAmount(n: number): string {
  return `$${n.toLocaleString("en-US")}`;
}

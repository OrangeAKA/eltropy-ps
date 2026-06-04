// app/api/voice/confirm/route.ts
//
// Receives the 1/2 DTMF confirmation. On 1: pushes the confirmed trigger
// onto the pending queue (browser picks it up via /api/voice/poll and
// fires sendTrigger). On 2: redirects back to the intent prompt to let
// the member restate.

import { NextRequest } from "next/server";
import twilio from "twilio";
import {
  getCallState,
  pushPendingTrigger,
  upsertCallState,
} from "@/lib/twilio/call-state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const callSid = (form.get("CallSid") as string) ?? "";
  const digits = (form.get("Digits") as string) ?? "";

  const response = new twilio.twiml.VoiceResponse();
  const state = getCallState(callSid);

  if (!state || !state.intent || !state.transcript || !state.selectedMemberPhone) {
    response.say(
      { voice: "Polly.Joanna" },
      "Your session expired. Please call back to start over.",
    );
    response.hangup();
    return new Response(response.toString(), {
      headers: { "Content-Type": "text/xml" },
    });
  }

  if (digits === "2") {
    // Re-prompt for intent — clear the slot-fill counter so the member
    // gets a fresh window of follow-ups on the restated request.
    upsertCallState(callSid, {
      transcript: undefined,
      intent: undefined,
      slotFillAttempts: 0,
    });
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
      "No problem. Go ahead and tell me again, in a few words, how I can help.",
    );
    response.hangup();
    return new Response(response.toString(), {
      headers: { "Content-Type": "text/xml" },
    });
  }

  if (digits !== "1") {
    response.say(
      { voice: "Polly.Joanna" },
      "I didn't catch that. Please call us back when you're ready and we'll pick up where we left off.",
    );
    response.hangup();
    return new Response(response.toString(), {
      headers: { "Content-Type": "text/xml" },
    });
  }

  // Confirmed — push the trigger for the browser to pick up.
  upsertCallState(callSid, { confirmed: true });
  pushPendingTrigger({
    callSid,
    fromPhone: state.fromPhone,
    selectedMemberPhone: state.selectedMemberPhone,
    selectedMemberName: state.selectedMemberName ?? "Member",
    body: state.transcript,
    intent: state.intent,
    channel: "voice",
    createdAt: Date.now(),
  });

  const firstName = (state.selectedMemberName ?? "Member").split(" ")[0];
  const closing = closingForIntent(state.intent.intent, firstName);
  response.say({ voice: "Polly.Joanna" }, closing);
  response.hangup();

  return new Response(response.toString(), {
    headers: { "Content-Type": "text/xml" },
  });
}

function closingForIntent(intent: string, firstName: string): string {
  switch (intent) {
    case "transfer_funds":
      return `Got it, ${firstName}. I'm getting that transfer started right now. You'll get a confirmation text in just a moment. Thanks for calling Cyprus Credit Union.`;

    case "balance_inquiry":
      return `No problem, ${firstName}. I'll text you the balances in just a moment. Thanks for calling Cyprus Credit Union.`;

    case "card_dispute":
      return `Sorry to hear that, ${firstName}. I'm filing the dispute right now and an officer will reach out shortly to walk through the next steps. You'll get a text confirmation in just a moment. Thanks for calling Cyprus Credit Union.`;

    case "lending_inquiry":
      return `Sure, ${firstName}. I'll start looking at loan options for you, and a member services officer will reach out shortly with your pre-qualified rates. Thanks for calling Cyprus Credit Union.`;

    case "refinance_inquiry":
      return `Got it, ${firstName}. I'll start comparing rates against your existing loan, and an officer will follow up shortly with what we can offer. Thanks for calling Cyprus Credit Union.`;

    default:
      return `Thanks, ${firstName}. I'm getting a member services officer to help with that. They'll be in touch with you shortly. Thanks for calling Cyprus Credit Union.`;
  }
}

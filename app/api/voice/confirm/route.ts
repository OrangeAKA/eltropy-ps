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
import { preflightTransfer } from "@/lib/twilio/preflight-transfer";
import { memberById } from "@/lib/twilio/demo-roster";

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

  const firstName = (state.selectedMemberName ?? "Member").split(" ")[0];

  // ── Voice-layer preflight for transfers. Catches insufficient funds,
  //    daily-limit, missing-account, and same-account cases inline so the
  //    member hears the specific reason while still on the call instead
  //    of via a text afterward.
  if (state.intent.intent === "transfer_funds" && state.selectedMemberId) {
    const member = memberById(state.selectedMemberId);
    const amount = state.intent.entities.amount as number | undefined;
    const fromAcct = state.intent.entities.from_account_type as string | undefined;
    const toAcct = state.intent.entities.to_account_type as string | undefined;

    if (member && typeof amount === "number" && fromAcct && toAcct) {
      const result = preflightTransfer(member, amount, fromAcct, toAcct);
      if (!result.allowed) {
        response.say(
          { voice: "Polly.Joanna" },
          `I'm sorry, ${firstName}, but ${result.message}`,
        );
        response.pause({ length: 1 });
        const gather = response.gather({
          numDigits: 1,
          action: "/api/voice/transfer-recheck",
          method: "POST",
          timeout: 8,
        });
        gather.say(
          { voice: "Polly.Joanna" },
          "Would you like to try a different amount, or speak with a member services officer? Press 1 to try a different amount, or press 2 for an officer.",
        );
        response.say(
          { voice: "Polly.Joanna" },
          "Let me get an officer to help you. Please hold.",
        );
        response.hangup();
        return new Response(response.toString(), {
          headers: { "Content-Type": "text/xml" },
        });
      }
    }
  }

  // Confirmed AND (for transfers) preflight passed — push the trigger.
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
      // Honest about uncertainty: the policy check hasn't run yet. The
      // member will get a text once the result is known — success,
      // queued for officer review, or held with a reason.
      return `Got it, ${firstName}. I'm running the checks on that request right now. You'll get a text in just a moment confirming the result. Thanks for calling Cyprus Credit Union.`;

    case "balance_inquiry":
      return `No problem, ${firstName}. I'll text you the balances in just a moment. Thanks for calling Cyprus Credit Union.`;

    case "card_dispute":
      return `Sorry to hear that, ${firstName}. I'm running the dispute through our review process now, and an officer will reach out shortly to walk through the next steps. Thanks for calling Cyprus Credit Union.`;

    case "lending_inquiry":
      return `Sure, ${firstName}. I'll start looking at loan options for you, and a member services officer will reach out shortly with what you qualify for. Thanks for calling Cyprus Credit Union.`;

    case "refinance_inquiry":
      return `Got it, ${firstName}. I'll start comparing rates against your existing loan, and an officer will follow up shortly with what we can offer. Thanks for calling Cyprus Credit Union.`;

    default:
      return `Thanks, ${firstName}. I'm getting a member services officer to help with that. They'll be in touch with you shortly. Thanks for calling Cyprus Credit Union.`;
  }
}

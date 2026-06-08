// app/api/voice/transfer-recheck/route.ts
//
// Handles the retry loop when the voice-layer preflight blocks a transfer.
// Three entry modes:
//
//   1. Member just heard a block reason and pressed:
//        Digits=1 → ask for a new amount via speech
//        Digits=2 → escalate to officer (graceful hangup)
//
//   2. Member responded with new amount speech:
//        SpeechResult set → extract amount, update intent, re-run preflight.
//          allowed   → speak readback, gather DTMF 1/2 → /api/voice/confirm
//          blocked   → speak new block reason, gather DTMF → loop back here
//
// This is the only route that loops — it's the place where the member
// converges on a viable amount or chooses to talk to a human.

import { NextRequest } from "next/server";
import twilio from "twilio";
import { getCallState, upsertCallState } from "@/lib/twilio/call-state";
import { preflightTransfer } from "@/lib/twilio/preflight-transfer";
import { memberById } from "@/lib/twilio/demo-roster";
import { extractSlotsServer } from "@/lib/orchestrator/llm-classify-server";
import type { IntentEntities } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_RETRY_ATTEMPTS = 3;

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const callSid = (form.get("CallSid") as string) ?? "";
  const digits = (form.get("Digits") as string) ?? "";
  const speech = ((form.get("SpeechResult") as string) ?? "").trim();

  const response = new twilio.twiml.VoiceResponse();
  const state = await getCallState(callSid);

  if (!state || !state.intent || !state.selectedMemberId) {
    response.say(
      { voice: "Polly.Joanna" },
      "It looks like the call has timed out. Please call us back and we'll pick up where we left off.",
    );
    response.hangup();
    return new Response(response.toString(), {
      headers: { "Content-Type": "text/xml" },
    });
  }

  const firstName = (state.selectedMemberName ?? "Member").split(" ")[0];
  const member = memberById(state.selectedMemberId);
  if (!member) {
    response.say(
      { voice: "Polly.Joanna" },
      "Let me get a member services officer to help. Please hold.",
    );
    response.hangup();
    return new Response(response.toString(), {
      headers: { "Content-Type": "text/xml" },
    });
  }

  // ── Mode A: caller just heard a block message; this is a DTMF response.
  if (speech.length === 0 && (digits === "1" || digits === "2")) {
    if (digits === "2") {
      response.say(
        { voice: "Polly.Joanna" },
        `No problem, ${firstName}. Let me get a member services officer to help you with this. Please hold.`,
      );
      response.hangup();
      return new Response(response.toString(), {
        headers: { "Content-Type": "text/xml" },
      });
    }

    // Digits === "1": ask for a new amount via speech.
    const gather = response.gather({
      input: ["speech"],
      action: "/api/voice/transfer-recheck",
      method: "POST",
      speechTimeout: "auto",
      language: "en-US",
      timeout: 10,
    });
    gather.say(
      { voice: "Polly.Joanna" },
      "Go ahead and tell me the new amount you'd like to transfer.",
    );
    response.say(
      { voice: "Polly.Joanna" },
      "I didn't catch the amount. Let me get an officer to help. Please hold.",
    );
    response.hangup();
    return new Response(response.toString(), {
      headers: { "Content-Type": "text/xml" },
    });
  }

  // ── Mode B: caller responded with new-amount speech. Extract and re-validate.
  if (speech.length > 0) {
    const retryCount = state.slotFillAttempts ?? 0;
    if (retryCount >= MAX_RETRY_ATTEMPTS) {
      response.say(
        { voice: "Polly.Joanna" },
        `I'm having a hard time getting that to work, ${firstName}. Let me get a member services officer to help you with this. Please hold.`,
      );
      response.hangup();
      return new Response(response.toString(), {
        headers: { "Content-Type": "text/xml" },
      });
    }

    const extracted = await extractSlotsServer({
      utterance: speech,
      intent: state.intent.intent,
      missingSlots: ["amount"],
      knownEntities: state.intent.entities,
    });
    const newAmount = extracted.amount;

    if (typeof newAmount !== "number" || newAmount <= 0) {
      // Couldn't extract — ask once more, or escalate after the cap.
      await upsertCallState(callSid, { slotFillAttempts: retryCount + 1 });
      const reGather = response.gather({
        input: ["speech"],
        action: "/api/voice/transfer-recheck",
        method: "POST",
        speechTimeout: "auto",
        language: "en-US",
        timeout: 10,
      });
      reGather.say(
        { voice: "Polly.Joanna" },
        "I didn't catch the amount. Could you say it again, in dollars?",
      );
      response.say(
        { voice: "Polly.Joanna" },
        "Let me get an officer to help. Please hold.",
      );
      response.hangup();
      return new Response(response.toString(), {
        headers: { "Content-Type": "text/xml" },
      });
    }

    // Update the intent with the new amount.
    const updatedEntities: IntentEntities = {
      ...state.intent.entities,
      amount: newAmount,
    };
    const updatedIntent = { ...state.intent, entities: updatedEntities };
    await upsertCallState(callSid, {
      intent: updatedIntent,
      slotFillAttempts: retryCount + 1,
    });

    // Re-run preflight on the new amount.
    const fromAcct = updatedEntities.from_account_type as string | undefined;
    const toAcct = updatedEntities.to_account_type as string | undefined;
    if (!fromAcct || !toAcct) {
      response.say(
        { voice: "Polly.Joanna" },
        "Let me get an officer to help you. Please hold.",
      );
      response.hangup();
      return new Response(response.toString(), {
        headers: { "Content-Type": "text/xml" },
      });
    }
    const result = preflightTransfer(member, newAmount, fromAcct, toAcct);

    if (!result.allowed) {
      // Still blocked — speak the reason, loop the DTMF prompt.
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
        "Let me get an officer to help. Please hold.",
      );
      response.hangup();
      return new Response(response.toString(), {
        headers: { "Content-Type": "text/xml" },
      });
    }

    // Allowed — read back the new amount and route to confirm.
    response.say(
      { voice: "Polly.Joanna" },
      `Got it — that works. Just to confirm, you'd like to transfer $${newAmount.toLocaleString("en-US")} from your ${humanAccount(fromAcct)} account to your ${humanAccount(toAcct)} account.`,
    );
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
      "I didn't hear a response. Let me get an officer to help. Please hold.",
    );
    response.hangup();
    return new Response(response.toString(), {
      headers: { "Content-Type": "text/xml" },
    });
  }

  // ── No DTMF, no speech — caller stayed silent.
  response.say(
    { voice: "Polly.Joanna" },
    `I didn't catch a response, ${firstName}. Let me get an officer to help you. Please hold.`,
  );
  response.hangup();
  return new Response(response.toString(), {
    headers: { "Content-Type": "text/xml" },
  });
}

function humanAccount(type: string): string {
  return type.replace(/_/g, " ");
}

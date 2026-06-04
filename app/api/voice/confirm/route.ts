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
    // Re-prompt for intent
    upsertCallState(callSid, { transcript: undefined, intent: undefined });
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
      "No problem. Please tell me how we can help, in a few words.",
    );
    response.hangup();
    return new Response(response.toString(), {
      headers: { "Content-Type": "text/xml" },
    });
  }

  if (digits !== "1") {
    response.say(
      { voice: "Polly.Joanna" },
      "I didn't get that. Hanging up. Please call back to try again.",
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
  response.say(
    { voice: "Polly.Joanna" },
    `Thanks, ${firstName}. Your request is being processed. The Mission Control screen will show live updates. You'll receive a confirmation message shortly. Goodbye.`,
  );
  response.hangup();

  return new Response(response.toString(), {
    headers: { "Content-Type": "text/xml" },
  });
}

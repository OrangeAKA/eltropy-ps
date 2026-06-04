// app/api/voice/member-select/route.ts
//
// Receives the DTMF digit chosen at the greeting prompt, looks up the
// corresponding demo member, stores the selection in call state, and
// gathers the open-ended intent prompt via speech.

import { NextRequest } from "next/server";
import twilio from "twilio";
import { upsertCallState } from "@/lib/twilio/call-state";
import { rosterByDigit, DEMO_ROSTER } from "@/lib/twilio/demo-roster";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const callSid = (form.get("CallSid") as string) ?? "";
  const digits = (form.get("Digits") as string) ?? "";

  const response = new twilio.twiml.VoiceResponse();
  const entry = rosterByDigit(digits);

  if (!entry) {
    const choices = DEMO_ROSTER.map(
      (r) => `Press ${r.digit} for ${r.fullName}`,
    ).join(". ");
    const retryGather = response.gather({
      numDigits: 1,
      action: "/api/voice/member-select",
      method: "POST",
      timeout: 8,
    });
    retryGather.say(
      { voice: "Polly.Joanna" },
      `That selection wasn't recognized. ${choices}.`,
    );
    response.hangup();
    return new Response(response.toString(), {
      headers: { "Content-Type": "text/xml" },
    });
  }

  upsertCallState(callSid, {
    selectedMemberId: entry.memberId,
    selectedMemberPhone: entry.phone,
    selectedMemberName: entry.fullName,
  });

  const firstName = entry.fullName.split(" ")[0];
  response.say(
    { voice: "Polly.Joanna" },
    `Hi ${firstName}, thanks for calling Cyprus Credit Union. This call is recorded for quality.`,
  );
  response.pause({ length: 1 });

  const intentGather = response.gather({
    input: ["speech"],
    action: "/api/voice/intent",
    method: "POST",
    speechTimeout: "auto",
    language: "en-US",
    timeout: 10,
  });
  intentGather.say(
    { voice: "Polly.Joanna" },
    "How can I help you today? You can ask about your accounts, move money between them, dispute a charge, or ask about a loan.",
  );

  response.say(
    { voice: "Polly.Joanna" },
    "I didn't catch that. Let me transfer you to a member services officer. Please hold.",
  );
  response.hangup();

  return new Response(response.toString(), {
    headers: { "Content-Type": "text/xml" },
  });
}

// app/api/voice/incoming/route.ts
//
// First webhook in the IVR chain. Twilio hits this when a call lands on
// the Cyprus CU number (PSTN or browser SDK). Returns TwiML to greet the
// caller and prompt for member selection via DTMF.
//
// Demo design: instead of ANI lookup (which won't match the caller's
// number), we ask the caller to choose which demo member they're calling
// as. This makes the flow legible and lets one demo number serve many
// scenarios.

import { NextRequest } from "next/server";
import twilio from "twilio";
import { upsertCallState } from "@/lib/twilio/call-state";
import { DEMO_ROSTER } from "@/lib/twilio/demo-roster";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const callSid = (form.get("CallSid") as string) ?? `local_${Date.now()}`;
  const fromPhone = (form.get("From") as string) ?? "";

  upsertCallState(callSid, {}, { fromPhone });

  const response = new twilio.twiml.VoiceResponse();
  // Leading pause lets the browser SDK's audio path settle before the
  // first <Say>. Without this, the start of the greeting gets spoken
  // into a not-yet-ready stream and the caller misses the first ~1s
  // ("Welcome. To get started, please select a…"). Standard pattern
  // for Voice SDK callers; harmless for PSTN dial-in.
  response.pause({ length: 1 });
  response.say(
    { voice: "Polly.Joanna" },
    "Welcome. To get started, please select a sample member account.",
  );
  response.pause({ length: 1 });

  const gather = response.gather({
    numDigits: 1,
    action: "/api/voice/member-select",
    method: "POST",
    timeout: 8,
  });
  const choices = DEMO_ROSTER.map((r) => `Press ${r.digit} for ${r.fullName}`).join(". ");
  gather.say({ voice: "Polly.Joanna" }, `${choices}.`);

  response.say(
    { voice: "Polly.Joanna" },
    "I didn't get a selection. Please call back when you're ready. Goodbye.",
  );
  response.hangup();

  return new Response(response.toString(), {
    headers: { "Content-Type": "text/xml" },
  });
}

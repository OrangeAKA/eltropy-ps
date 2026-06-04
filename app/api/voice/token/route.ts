// app/api/voice/token/route.ts
//
// Mints a short-lived Twilio access token for the browser Voice SDK.
// The browser uses this token to register as a WebRTC client and place
// a call to the configured Cyprus CU number, bypassing PSTN charges
// entirely (free for the caller, just the standard Twilio inbound rate
// applies on receipt).
//
// Required env vars:
//   TWILIO_ACCOUNT_SID
//   TWILIO_API_KEY            — SK... key SID (NOT the auth token)
//   TWILIO_API_SECRET         — paired secret
//   TWILIO_TWIML_APP_SID      — TwiML App SID whose Voice URL points
//                                back at /api/voice/incoming
//
// The TwiML App is what tells Twilio "when this client connects, run
// the IVR webhook." Create it once in the Twilio Console.

import { NextRequest } from "next/server";
import twilio from "twilio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const apiKey = process.env.TWILIO_API_KEY;
  const apiSecret = process.env.TWILIO_API_SECRET;
  const twimlAppSid = process.env.TWILIO_TWIML_APP_SID;

  if (!accountSid || !apiKey || !apiSecret || !twimlAppSid) {
    return Response.json(
      {
        error:
          "Twilio environment variables missing. Need TWILIO_ACCOUNT_SID, TWILIO_API_KEY, TWILIO_API_SECRET, TWILIO_TWIML_APP_SID.",
      },
      { status: 503 },
    );
  }

  const identity = `demo-caller-${Math.random().toString(36).slice(2, 10)}`;

  const AccessToken = twilio.jwt.AccessToken;
  const VoiceGrant = AccessToken.VoiceGrant;

  const token = new AccessToken(accountSid, apiKey, apiSecret, {
    identity,
    ttl: 3600,
  });

  const grant = new VoiceGrant({
    outgoingApplicationSid: twimlAppSid,
    incomingAllow: false,
  });
  token.addGrant(grant);

  return Response.json(
    { token: token.toJwt(), identity },
    { headers: { "Cache-Control": "no-store" } },
  );
}

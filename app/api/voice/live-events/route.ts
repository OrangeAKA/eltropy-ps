// app/api/voice/live-events/route.ts
//
// Polled by the browser to drain any voice live events that have
// accumulated since the last tick. Pairs with /api/voice/poll which
// returns the final confirmed trigger after the call ends; this
// endpoint returns the intermediate events that happened during the
// call (member identified, intent captured, request confirmed) so
// Mission Control's activity feed can light up while the call is
// still in progress.

import { takeVoiceEvents } from "@/lib/twilio/live-events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const events = takeVoiceEvents();
  return Response.json({ events });
}

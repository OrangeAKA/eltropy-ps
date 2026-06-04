// app/api/voice/poll/route.ts
//
// Browser polling endpoint. Returns the next confirmed pending trigger
// (if any), removing it from the queue atomically so it's only delivered
// once. The browser then fires sendTrigger() with the returned payload,
// running the existing demo pipeline against the live call.

import { NextRequest } from "next/server";
import { takePendingTrigger } from "@/lib/twilio/call-state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  const next = takePendingTrigger();
  if (!next) {
    return Response.json({ trigger: null }, { headers: { "Cache-Control": "no-store" } });
  }

  return Response.json(
    {
      trigger: {
        callSid: next.callSid,
        channel: next.channel,
        fromPhone: next.selectedMemberPhone,
        body: next.body,
        memberName: next.selectedMemberName,
        intent: next.intent,
        createdAt: next.createdAt,
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

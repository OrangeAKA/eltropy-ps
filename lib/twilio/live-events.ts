// lib/twilio/live-events.ts
//
// Partial events emitted by the IVR webhooks while a call is still in
// progress. The browser polls these events and surfaces them in
// Mission Control's audit log, so the cockpit shows live activity
// while the member is still on the phone — instead of waiting until
// the call hangs up and the workflow fires.
//
// Lives in a globalThis-backed list, same pattern as pendingTriggers.
// In production swap for Upstash KV or Redis.

import type { IntentClassification, IntentName, IntentEntities } from "@/lib/types";

export type VoiceLiveEvent =
  | {
      type: "member_identified";
      callSid: string;
      timestamp: number;
      memberId: string;
      memberName: string;
      memberPhone: string;
    }
  | {
      type: "intent_captured";
      callSid: string;
      timestamp: number;
      intent: IntentName;
      entities: IntentEntities;
      confidence: number;
    }
  | {
      type: "request_confirmed";
      callSid: string;
      timestamp: number;
      intent: IntentClassification;
    };

declare global {

  var __eltropy_voice_live_events: VoiceLiveEvent[] | undefined;
}

const events: VoiceLiveEvent[] =
  globalThis.__eltropy_voice_live_events ?? [];
globalThis.__eltropy_voice_live_events = events;

const MAX_EVENT_TTL_MS = 10 * 60 * 1000; // 10 min

function pruneStale(): void {
  const now = Date.now();
  while (events.length > 0 && now - events[0].timestamp > MAX_EVENT_TTL_MS) {
    events.shift();
  }
}

export function pushVoiceEvent(event: VoiceLiveEvent): void {
  pruneStale();
  events.push(event);
}

// Drain and return all pending events. The browser is the single
// consumer, so once an event is taken it's removed from the queue.
export function takeVoiceEvents(): VoiceLiveEvent[] {
  pruneStale();
  const drained = events.splice(0, events.length);
  return drained;
}

export function peekVoiceEvents(): VoiceLiveEvent[] {
  pruneStale();
  return [...events];
}

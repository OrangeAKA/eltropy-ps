// lib/twilio/live-events.ts
//
// Partial events emitted by the IVR webhooks while a call is still in
// progress. The browser polls these events and surfaces them in
// Mission Control's audit log, so the cockpit shows live activity
// while the member is still on the phone.
//
// Same dual-store pattern as call-state.ts: Upstash Redis primary,
// in-memory fallback for local dev when Redis env vars are absent.

import type { IntentClassification, IntentName, IntentEntities } from "@/lib/types";
import { redis, hasRedis } from "./redis";

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

const EVENTS_KEY = "eltropy:voice_events";
const MAX_EVENT_TTL_MS = 10 * 60 * 1000;

// ── In-memory fallback ─────────────────────────────────────────────────────

declare global {

  var __eltropy_voice_live_events: VoiceLiveEvent[] | undefined;
}

const memEvents: VoiceLiveEvent[] =
  globalThis.__eltropy_voice_live_events ?? [];
globalThis.__eltropy_voice_live_events = memEvents;

function pruneStaleMem(): void {
  const now = Date.now();
  while (memEvents.length > 0 && now - memEvents[0].timestamp > MAX_EVENT_TTL_MS) {
    memEvents.shift();
  }
}

// ── Public API ─────────────────────────────────────────────────────────────

export async function pushVoiceEvent(event: VoiceLiveEvent): Promise<void> {
  if (hasRedis && redis) {
    await redis.rpush(EVENTS_KEY, JSON.stringify(event));
    await redis.expire(EVENTS_KEY, 600);
    return;
  }
  pruneStaleMem();
  memEvents.push(event);
}

// Drain and return all pending events. The browser is the single
// consumer, so once an event is taken it's removed from the queue.
export async function takeVoiceEvents(): Promise<VoiceLiveEvent[]> {
  if (hasRedis && redis) {
    const raws = await redis.lrange<string>(EVENTS_KEY, 0, -1);
    if (raws.length === 0) return [];
    await redis.del(EVENTS_KEY);
    return raws.map((r) =>
      typeof r === "string" ? (JSON.parse(r) as VoiceLiveEvent) : (r as VoiceLiveEvent),
    );
  }
  pruneStaleMem();
  const drained = memEvents.splice(0, memEvents.length);
  return drained;
}

export async function peekVoiceEvents(): Promise<VoiceLiveEvent[]> {
  if (hasRedis && redis) {
    const raws = await redis.lrange<string>(EVENTS_KEY, 0, -1);
    return raws.map((r) =>
      typeof r === "string" ? (JSON.parse(r) as VoiceLiveEvent) : (r as VoiceLiveEvent),
    );
  }
  pruneStaleMem();
  return [...memEvents];
}

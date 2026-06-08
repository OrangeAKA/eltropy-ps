// lib/twilio/call-state.ts
//
// Call state shared across the webhook chain (incoming → member-select
// → intent → confirm → transfer-recheck). Keyed by Twilio CallSid.
//
// Primary store: Upstash Redis (when env vars are configured). This is
// required in production because each Twilio webhook is a separate
// HTTP POST that Vercel can route to a different serverless function
// instance. The previous in-memory-only Map would silently drop state
// when /confirm landed on a different instance than /incoming, killing
// the "session expired" error mid-call.
//
// Fallback store: in-memory Map (used when Redis env vars are absent,
// e.g. local dev). Has the original cross-instance limitation but lets
// devs run the IVR locally without provisioning Redis first.

import type { IntentClassification } from "@/lib/types";
import { redis, hasRedis } from "./redis";

export type CallState = {
  callSid: string;
  fromPhone: string;
  selectedMemberId?: string;
  selectedMemberPhone?: string;
  selectedMemberName?: string;
  transcript?: string;
  intent?: IntentClassification;
  confirmed?: boolean;
  pickedUpByBrowser?: boolean;
  // How many times we've re-prompted for missing slots on this call.
  // Capped to avoid infinite loops; escalate to officer after limit.
  slotFillAttempts?: number;
  createdAt: number;
  updatedAt: number;
};

export type PendingTrigger = {
  callSid: string;
  fromPhone: string;
  selectedMemberPhone: string;
  selectedMemberName: string;
  body: string;
  intent: IntentClassification;
  channel: "voice";
  createdAt: number;
};

const CALL_KEY = (sid: string): string => `eltropy:call:${sid}`;
const TRIGGERS_KEY = "eltropy:pending_triggers";
const CALL_TTL_SEC = 600; // 10 min — matches the previous Map prune

// ── In-memory fallback (local dev only when Redis env vars absent) ─────────

declare global {

  var __eltropy_call_state: Map<string, CallState> | undefined;

  var __eltropy_pending_triggers: PendingTrigger[] | undefined;
}

const memCalls: Map<string, CallState> =
  globalThis.__eltropy_call_state ?? new Map<string, CallState>();
globalThis.__eltropy_call_state = memCalls;

const memTriggers: PendingTrigger[] =
  globalThis.__eltropy_pending_triggers ?? [];
globalThis.__eltropy_pending_triggers = memTriggers;

const MAX_CALL_TTL_MS = 10 * 60 * 1000;

function pruneStaleMem(): void {
  const now = Date.now();
  for (const [sid, state] of memCalls.entries()) {
    if (now - state.createdAt > MAX_CALL_TTL_MS) {
      memCalls.delete(sid);
    }
  }
  while (
    memTriggers.length > 0 &&
    now - memTriggers[0].createdAt > MAX_CALL_TTL_MS
  ) {
    memTriggers.shift();
  }
}

// ── Public API ─────────────────────────────────────────────────────────────

export async function getCallState(
  callSid: string,
): Promise<CallState | undefined> {
  if (hasRedis && redis) {
    const raw = await redis.get<CallState>(CALL_KEY(callSid));
    return raw ?? undefined;
  }
  pruneStaleMem();
  return memCalls.get(callSid);
}

export async function upsertCallState(
  callSid: string,
  patch: Partial<Omit<CallState, "callSid" | "createdAt">>,
  defaults: Pick<CallState, "fromPhone"> = { fromPhone: "" },
): Promise<CallState> {
  const existing = await getCallState(callSid);
  const now = Date.now();
  const next: CallState = existing
    ? { ...existing, ...patch, updatedAt: now }
    : {
        callSid,
        fromPhone: defaults.fromPhone,
        createdAt: now,
        updatedAt: now,
        ...patch,
      };

  if (hasRedis && redis) {
    await redis.set(CALL_KEY(callSid), next, { ex: CALL_TTL_SEC });
  } else {
    memCalls.set(callSid, next);
  }
  return next;
}

export async function pushPendingTrigger(
  trigger: PendingTrigger,
): Promise<void> {
  if (hasRedis && redis) {
    await redis.rpush(TRIGGERS_KEY, JSON.stringify(trigger));
    return;
  }
  memTriggers.push(trigger);
}

export async function takePendingTrigger(): Promise<PendingTrigger | undefined> {
  if (hasRedis && redis) {
    const raw = await redis.lpop<string>(TRIGGERS_KEY);
    if (!raw) return undefined;
    // Upstash auto-parses JSON values written via redis.set, but rpush
    // takes raw strings — we stringified on the way in, parse on the way
    // out. Defensive: if the SDK already deserialized to an object, pass
    // through.
    return typeof raw === "string"
      ? (JSON.parse(raw) as PendingTrigger)
      : (raw as PendingTrigger);
  }
  pruneStaleMem();
  return memTriggers.shift();
}

export async function peekPendingTriggers(): Promise<PendingTrigger[]> {
  if (hasRedis && redis) {
    const raws = await redis.lrange<string>(TRIGGERS_KEY, 0, -1);
    return raws.map((r) =>
      typeof r === "string" ? (JSON.parse(r) as PendingTrigger) : (r as PendingTrigger),
    );
  }
  pruneStaleMem();
  return [...memTriggers];
}

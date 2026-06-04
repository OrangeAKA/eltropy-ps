// lib/twilio/call-state.ts
//
// In-memory call state shared across the webhook chain.
// Keyed by Twilio CallSid. Survives within a warm serverless instance for
// the lifetime of a single call (under a minute in the demo flow).
//
// For production, swap the underlying Map for Upstash Redis or Vercel KV.
// The interface stays the same.

import type { IntentClassification } from "@/lib/types";

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

declare global {

  var __eltropy_call_state: Map<string, CallState> | undefined;

  var __eltropy_pending_triggers: PendingTrigger[] | undefined;
}

const calls: Map<string, CallState> =
  globalThis.__eltropy_call_state ?? new Map<string, CallState>();
globalThis.__eltropy_call_state = calls;

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

const pendingTriggers: PendingTrigger[] =
  globalThis.__eltropy_pending_triggers ?? [];
globalThis.__eltropy_pending_triggers = pendingTriggers;

const MAX_CALL_TTL_MS = 10 * 60 * 1000; // 10 min

function pruneStale(): void {
  const now = Date.now();
  for (const [sid, state] of calls.entries()) {
    if (now - state.createdAt > MAX_CALL_TTL_MS) {
      calls.delete(sid);
    }
  }
  while (
    pendingTriggers.length > 0 &&
    now - pendingTriggers[0].createdAt > MAX_CALL_TTL_MS
  ) {
    pendingTriggers.shift();
  }
}

export function getCallState(callSid: string): CallState | undefined {
  pruneStale();
  return calls.get(callSid);
}

export function upsertCallState(
  callSid: string,
  patch: Partial<Omit<CallState, "callSid" | "createdAt">>,
  defaults: Pick<CallState, "fromPhone"> = { fromPhone: "" },
): CallState {
  pruneStale();
  const existing = calls.get(callSid);
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
  calls.set(callSid, next);
  return next;
}

export function pushPendingTrigger(trigger: PendingTrigger): void {
  pendingTriggers.push(trigger);
}

export function takePendingTrigger(): PendingTrigger | undefined {
  pruneStale();
  return pendingTriggers.shift();
}

export function peekPendingTriggers(): PendingTrigger[] {
  pruneStale();
  return [...pendingTriggers];
}

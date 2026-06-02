// lib/skills/call-auth.ts
// Channel-level authentication for voice calls.
// Verifies ANI (registered phone number) and simulates DTMF PIN verification.
// Returns a preVerified flag that downstream skills use to reduce friction.

import type { SkillExecutionResult } from "@/lib/types";
import type { TriggerChannel } from "@/lib/types";

export type CallAuthInputs = {
  phone: string;
  channel: TriggerChannel;
  registeredPhone?: string;
};

export async function executeCallAuth(
  inputs: CallAuthInputs,
): Promise<SkillExecutionResult> {
  const startedAt = new Date().toISOString();
  const start = performance.now();

  await new Promise((r) => setTimeout(r, 160 + Math.random() * 60));

  // For voice: ANI match + DTMF PIN simulated as passing
  const isVoice = inputs.channel === "voice";
  const aniVerified = isVoice
    ? inputs.registeredPhone
      ? inputs.phone === inputs.registeredPhone
      : true
    : false;
  const dtmfPinVerified = isVoice;
  const preVerified = aniVerified && dtmfPinVerified;

  const durationMs = Math.round(performance.now() - start);

  return {
    skillId: "skill-call-auth",
    status: "completed",
    startedAt,
    completedAt: new Date().toISOString(),
    durationMs,
    inputs: { phone: inputs.phone, channel: inputs.channel },
    outputs: { aniVerified, dtmfPinVerified, preVerified },
    adapter: "EltropyVoicePlatform",
    rationale: isVoice
      ? `ANI verified (${inputs.phone} on registered number). DTMF PIN confirmed. Channel pre-authenticated — downstream identity friction reduced per FFIEC risk-based guidance.`
      : `Non-voice channel (${inputs.channel}): ANI/DTMF check not applicable.`,
  };
}

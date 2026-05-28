// lib/skills/stepup-auth.ts
//
// Skill: Authorization Gate (a.k.a. Step-Up Auth)
// Decides what authorization is required for an account-impacting action
// based on channel, amount, and existing identity-verification state.
// Then executes that authorization. Returns the method used + approval
// outcome + a citation string for the audit log.
//
// Realistic model: FFIEC guidance is risk-based, not blanket MFA.
//
// Rules (mirrors a typical CU's authorization policy):
//   - Voice + identity verified + internal transfer + under $25K
//       → method = verbal_on_voice. The authenticated, recorded call IS
//         the consent. No separate second factor. Approved = true.
//   - SMS / chat channel (any amount)
//       → method = secure_link. The channel itself is not pre-authenticated
//         (phone numbers can be spoofed), so we send a secure-link / OTP.
//   - Voice + amount over $25K
//       → method = push_approval. Step-up required for high-dollar.
//   - Anything else (e.g., unverified identity)
//       → method = push_approval. Fail-safe.
//
// Mock note: sub-prime members in this demo simulate "no mobile app
// enrolled" and the push approval can't be delivered, which routes to
// officer callback. Production replaces the simulation with the actual
// push / OTP delivery + response.

import type { Member } from "@/data/members";
import type {
  SkillExecutionResult,
  StepUpAuthResult,
  TriggerChannel,
} from "@/lib/types";

export const SKILL_ID = "skill-stepup-auth";
export const VERBAL_THRESHOLD_USD = 25_000;

export type StepUpAuthInputs = {
  member: Member;
  channel: TriggerChannel;
  reason: string;
  expectedAmountUsd?: number;
  identityVerified: boolean;
};

export type StepUpAuthOutputs = {
  stepUp: StepUpAuthResult;
};

const DEVICE_LABELS: Record<string, string> = {
  "8842914": "iPhone 15 Pro · last seen Seattle, WA",
  "7193052": "Pixel 8 · last seen Houston, TX",
  "5064731": "iPad Air · last seen Spokane, WA",
  "6318405": "iPhone 13 · last seen Houston, TX",
  "9247163": "Pixel 7a · last seen Salt Lake City, UT",
  "3851920": "iPhone 15 · last seen Denver, CO",
};

type Decision = {
  method: StepUpAuthResult["method"];
  adapter: string;
  reason: string;
};

function decideMethod(inputs: StepUpAuthInputs): Decision {
  const amount = inputs.expectedAmountUsd ?? 0;
  const isVoice = inputs.channel === "voice";
  const isSmsLike = inputs.channel === "sms" || inputs.channel === "chat";

  if (isVoice && inputs.identityVerified && amount < VERBAL_THRESHOLD_USD) {
    return {
      method: "verbal_on_voice",
      adapter: "EltropyVoiceCallRecording",
      reason: `Voice channel + identity verified + amount $${amount.toLocaleString()} below $${VERBAL_THRESHOLD_USD.toLocaleString()} threshold. Verbal authorization on recorded line satisfies FFIEC risk-based MFA.`,
    };
  }

  if (isSmsLike) {
    return {
      method: "secure_link",
      adapter: "EltropySecureLink",
      reason: `Channel ${inputs.channel} is not pre-authenticated. Secure-link click-through required before any EFT.`,
    };
  }

  // Voice but amount over threshold, OR identity not verified → push.
  return {
    method: "push_approval",
    adapter: "EltropyMobilePush",
    reason:
      amount >= VERBAL_THRESHOLD_USD
        ? `Amount $${amount.toLocaleString()} at or above $${VERBAL_THRESHOLD_USD.toLocaleString()} threshold. Push approval required regardless of channel.`
        : `Identity verification did not pass; falling back to out-of-band push approval.`,
  };
}

export async function executeStepUpAuth(
  inputs: StepUpAuthInputs,
): Promise<SkillExecutionResult<StepUpAuthOutputs>> {
  const startedAt = new Date().toISOString();
  const start = performance.now();
  const decision = decideMethod(inputs);
  const promptedAt = new Date().toISOString();

  let approved = true;
  let rationale: string;
  let deviceLabel: string | undefined;

  if (decision.method === "verbal_on_voice") {
    // No async round trip — just simulate the policy lookup + logging.
    await wait(180 + Math.random() * 120);
    rationale = decision.reason;
  } else {
    // Async round trip: push notification or secure link.
    await wait(1400 + Math.random() * 400);
    deviceLabel =
      decision.method === "push_approval"
        ? DEVICE_LABELS[inputs.member.id] ?? "registered device"
        : `secure link → ${inputs.member.phone}`;
    // Mock: sub-prime members simulate "no mobile app enrolled" or
    // "did not respond in time" → escalate.
    approved = inputs.member.memberTier !== "sub-prime";
    rationale = approved
      ? decision.method === "push_approval"
        ? `${decision.reason} Push confirmed on ${deviceLabel} via Face ID. GLBA + FFIEC MFA satisfied.`
        : `${decision.reason} Member opened the secure link and confirmed. GLBA + FFIEC MFA satisfied.`
      : `${decision.reason} No response received within timeout — routing to officer for callback verification.`;
  }

  const respondedAt = new Date().toISOString();

  const stepUp: StepUpAuthResult = {
    method: decision.method,
    approved,
    promptedAt,
    respondedAt,
    channel: inputs.channel,
    deviceLabel,
    rationale,
  };

  return {
    skillId: SKILL_ID,
    status: "completed",
    startedAt,
    completedAt: respondedAt,
    durationMs: Math.round(performance.now() - start),
    inputs: {
      memberId: inputs.member.id,
      channel: inputs.channel,
      reason: inputs.reason,
      expectedAmountUsd: inputs.expectedAmountUsd ?? null,
      identityVerified: inputs.identityVerified,
    },
    adapter: decision.adapter,
    outputs: { stepUp },
    rationale,
  };
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

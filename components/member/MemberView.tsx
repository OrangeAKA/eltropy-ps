"use client";

import { PhoneFrame } from "./PhoneFrame";
import { VoiceCallButton } from "@/components/VoiceCallButton";
import type { DemoState } from "@/lib/types";

interface MemberViewProps {
  state: DemoState;
  memberName?: string;
}

// The Cyprus CU member surface. Lives inside a PhoneFrame to read as a
// real banking app. Members initiate calls here (VoiceCallButton is the
// primary CTA), and outcomes from the call land here too (pending
// review cards, approval confirmations, SMS notifications).
//
// During an active call the VoiceCallButton itself expands into the
// dialer + DTMF + hang-up controls. The cards below the call control
// reflect the durable outcome state from the demo controller.
export function MemberView({ state, memberName }: MemberViewProps) {
  const firstName = memberName?.split(" ")[0];
  const onCall = state.phase !== "idle";

  return (
    <PhoneFrame>
      <header className="mt-2 mb-5">
        <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          Cyprus Credit Union
        </p>
        <h1 className="mt-1 font-serif text-[24px] leading-tight tracking-[-0.01em] text-foreground">
          {firstName ? `Hi, ${firstName}` : "Welcome"}
        </h1>
        <p className="mt-1 text-[13px] leading-relaxed text-secondary-foreground">
          Talk to a banker, check on a transfer, or get help with your account.
        </p>
      </header>

      {/* Primary action — the call itself */}
      <section className="mb-5">
        <VoiceCallButton />
      </section>

      {/* Contextual status — adapts to what's happening in the system.
          Phase 2 will wire more states from useDemoController; for now
          we show a calm idle hint plus on-call reassurance. */}
      <section className="space-y-3">
        {onCall ? <OnCallCard /> : <IdleHintCard />}
      </section>

      {/* Footer / privacy hint */}
      <footer className="mt-6 mb-2">
        <p className="text-[10px] leading-relaxed text-muted-foreground">
          Federally insured by NCUA. Calls may be recorded for quality and
          training.
        </p>
      </footer>
    </PhoneFrame>
  );
}

function IdleHintCard() {
  return (
    <div
      className="rounded-2xl border p-4"
      style={{
        background: "var(--color-member-card)",
        borderColor: "var(--color-member-rule)",
      }}
    >
      <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-1.5">
        Common requests
      </p>
      <ul className="space-y-1 text-[13px] text-foreground leading-relaxed">
        <li>Move money between your accounts</li>
        <li>Check a recent charge or dispute a transaction</li>
        <li>Ask about loan or refinance options</li>
      </ul>
      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        Tap <span className="font-medium text-foreground">Talk to Cyprus CU</span>{" "}
        and just say what you need.
      </p>
    </div>
  );
}

function OnCallCard() {
  return (
    <div
      className="rounded-2xl border p-4"
      style={{
        background: "var(--color-member-card)",
        borderColor: "var(--color-member-rule)",
      }}
    >
      <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-1.5">
        While you&rsquo;re on the call
      </p>
      <p className="text-[13px] leading-relaxed text-foreground">
        Speak naturally. Cyprus CU&rsquo;s assistant is listening and will
        confirm before doing anything to your account.
      </p>
      <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
        Stay on the line. If we need a member-services officer, we&rsquo;ll let
        you know.
      </p>
    </div>
  );
}

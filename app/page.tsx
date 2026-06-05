"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppHeader, type Perspective } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { MissionControlPane } from "@/components/mission-control/MissionControlPane";
import { CopilotPane } from "@/components/copilot/CopilotPane";
import { TriggerModal } from "@/components/TriggerModal";
import { MemberView } from "@/components/member/MemberView";
import { NudgeToast } from "@/components/member/NudgeToast";
import { useDemoController } from "@/lib/hooks/useDemoController";
import { cn } from "@/lib/utils";
import type { TriggerChannel } from "@/lib/types";
import type { VoiceLiveEvent } from "@/lib/twilio/live-events";

type PolledTrigger = {
  callSid: string;
  channel: "voice";
  fromPhone: string;
  body: string;
  memberName: string;
};

const NUDGE_AUTO_DISMISS_MS = 6000;

export default function Home() {
  const {
    state,
    sendTrigger,
    confirmOffer,
    modifyOffer,
    approveQueueItem,
    declineQueueItem,
    pushVoiceEvent,
    reset,
  } = useDemoController();

  const [triggerOpen, setTriggerOpen] = useState(false);

  // Perspective is which surface owns the screen. Defaults to 'member'
  // because the viewer's journey begins as the customer: they place the
  // call, then toggle to Mission Control to watch the system work.
  const [perspective, setPerspective] = useState<Perspective>("member");

  const [lastCallerName, setLastCallerName] = useState<string | undefined>(
    undefined,
  );

  // Nudge that prompts the viewer to switch to Mission Control the
  // moment MC starts doing visible work. Tied to state.phase rather
  // than to a timer — fires only when there's genuinely something to
  // see in the cockpit. Auto-dismisses if the viewer doesn't act.
  const [nudgeVisible, setNudgeVisible] = useState(false);
  const nudgeFiredForWorkRef = useRef(false);
  const nudgeTimerRef = useRef<number | null>(null);

  // Track the previous phase so we can detect the transition from
  // "idle" → "doing real work" and only fire the nudge on that edge.
  const prevPhaseRef = useRef(state.phase);

  const seenCallSids = useRef<Set<string>>(new Set());

  const dismissNudge = useCallback(() => {
    setNudgeVisible(false);
    if (nudgeTimerRef.current != null) {
      window.clearTimeout(nudgeTimerRef.current);
      nudgeTimerRef.current = null;
    }
  }, []);

  const armNudge = useCallback(() => {
    if (nudgeFiredForWorkRef.current) return;
    nudgeFiredForWorkRef.current = true;
    setNudgeVisible(true);
    if (nudgeTimerRef.current != null) {
      window.clearTimeout(nudgeTimerRef.current);
    }
    nudgeTimerRef.current = window.setTimeout(() => {
      setNudgeVisible(false);
      nudgeTimerRef.current = null;
    }, NUDGE_AUTO_DISMISS_MS);
  }, []);

  const handlePerspectiveChange = useCallback(
    (next: Perspective) => {
      setPerspective(next);
      // If the viewer follows the nudge into Mission Control, dismiss it.
      if (next === "cockpit") dismissNudge();
    },
    [dismissNudge],
  );

  const handleNudgeAction = useCallback(() => {
    handlePerspectiveChange("cockpit");
  }, [handlePerspectiveChange]);

  // sendTrigger fires when a real call lands (via polling) or when the
  // dev-side Send Trigger button injects a simulated trigger.
  const handleSendTrigger = useCallback(
    (payload: {
      channel: TriggerChannel;
      fromPhone: string;
      body: string;
    }) => {
      sendTrigger(payload);
    },
    [sendTrigger],
  );

  // Fire the nudge precisely when Mission Control actually starts
  // doing visible work — i.e., on the transition from "idle" to any
  // active phase (classifying, dispatching, awaiting confirm, etc.).
  // Resets when the system returns to idle so the next call gets a
  // fresh nudge.
  useEffect(() => {
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = state.phase;

    const wasIdle = prev === "idle";
    const nowActive = state.phase !== "idle";

    if (wasIdle && nowActive) {
      // Mission Control just lit up. Nudge only if the viewer is on
      // the member side — if they're already in the cockpit, they're
      // already watching the work happen.
      if (perspective === "member") {
        armNudge();
      }
    } else if (!wasIdle && state.phase === "idle") {
      // Returned to idle. Reset for the next call.
      nudgeFiredForWorkRef.current = false;
    }
  }, [state.phase, perspective, armNudge]);

  // Poll /api/voice/live-events for partial events emitted by the IVR
  // webhooks while the call is still in progress. Each event surfaces
  // in Mission Control's audit log immediately — so the cockpit shows
  // live activity while the member is mid-conversation, before the
  // call ends and the final trigger arrives.
  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch("/api/voice/live-events", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { events: VoiceLiveEvent[] };
        if (cancelled || !data.events?.length) return;
        for (const event of data.events) {
          pushVoiceEvent(event);
        }
      } catch {
        // network blip — try again next tick
      }
    };
    const interval = setInterval(tick, 1500);
    void tick();
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [pushVoiceEvent]);

  // Poll /api/voice/poll for confirmed inbound calls. When a new one
  // arrives, fire the wrapped trigger so the nudge fires alongside.
  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch("/api/voice/poll", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { trigger: PolledTrigger | null };
        if (cancelled || !data.trigger) return;
        if (seenCallSids.current.has(data.trigger.callSid)) return;
        seenCallSids.current.add(data.trigger.callSid);
        setLastCallerName(data.trigger.memberName);
        handleSendTrigger({
          channel: data.trigger.channel,
          fromPhone: data.trigger.fromPhone,
          body: data.trigger.body,
        });
      } catch {
        // network blip — try again next tick
      }
    };
    const interval = setInterval(tick, 1500);
    void tick();
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [handleSendTrigger]);

  // Cleanup nudge timer on unmount
  useEffect(() => {
    return () => {
      if (nudgeTimerRef.current != null) {
        window.clearTimeout(nudgeTimerRef.current);
      }
    };
  }, []);

  const isActive = state.phase !== "idle";
  const pristine = state.auditLog.length === 0 && !state.startedAt;

  return (
    <>
      <div className="hidden lg:flex flex-col flex-1 min-h-0">
        <AppHeader
          perspective={perspective}
          onPerspectiveChange={handlePerspectiveChange}
          onTriggerClick={() => setTriggerOpen(true)}
          onReset={() => {
            reset();
            nudgeFiredForWorkRef.current = false;
            prevPhaseRef.current = "idle";
            dismissNudge();
            setLastCallerName(undefined);
            setPerspective("member");
          }}
          isActive={isActive}
          pristine={pristine}
        />

        {/* Main area. Both perspectives are always mounted; we just hide
            the inactive one. This keeps the VoiceCallButton's Twilio
            Device alive across toggles so the call audio persists. */}
        <main className="flex-1 relative min-h-0 bg-[color:color-mix(in_oklch,var(--color-surface-page)_88%,white)]">
          {/* Member perspective */}
          <div
            className={cn(
              "absolute inset-0",
              perspective === "member" ? "block" : "hidden",
            )}
            aria-hidden={perspective !== "member"}
          >
            <MemberView state={state} memberName={lastCallerName} />
          </div>

          {/* Cockpit perspective */}
          <div
            className={cn(
              "absolute inset-0 grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] min-h-0",
              perspective === "cockpit" ? "grid" : "hidden",
            )}
            aria-hidden={perspective !== "cockpit"}
          >
            <MissionControlPane
              state={state}
              onApproveQueueItem={approveQueueItem}
              onDeclineQueueItem={declineQueueItem}
            />
            <CopilotPane
              state={state}
              onConfirm={confirmOffer}
              onModify={modifyOffer}
            />
          </div>
        </main>

        <AppFooter />

        {/* Directorial nudge. Only relevant while the viewer is in the
            member perspective; once they switch to cockpit (or dismiss),
            it goes away. */}
        <NudgeToast
          visible={nudgeVisible && perspective === "member"}
          onAction={handleNudgeAction}
          onDismiss={dismissNudge}
        />
      </div>

      {/* Mobile / small viewport fallback */}
      <div className="lg:hidden flex-1 flex flex-col items-center justify-center p-6 text-center bg-[color:color-mix(in_oklch,var(--color-brand-50)_54%,white)]">
        <div className="max-w-md rounded-2xl border border-rule bg-[color:color-mix(in_oklch,var(--color-surface-card)_88%,white)] px-5 py-6 shadow-[0_1px_0_rgba(255,255,255,0.7)]">
          <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-500 mb-2">
            Desktop Surface
          </p>
          <h1 className="font-serif text-xl font-medium tracking-[-0.02em] mb-2">
            Eltropy Mission Control
          </h1>
          <p className="text-sm text-neutral-600 leading-relaxed mb-4">
            This prototype is designed for desktop viewing. The split-screen
            Mission Control + Copilot layout requires at least 1024px of width.
          </p>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Open this URL on a laptop or external display to review the full
            workflow, audit log, and officer approval surfaces together.
          </p>
        </div>
      </div>

      <TriggerModal
        open={triggerOpen}
        onOpenChange={setTriggerOpen}
        onSend={(payload) => handleSendTrigger(payload)}
      />
    </>
  );
}

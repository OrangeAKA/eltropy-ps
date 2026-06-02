"use client";

import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { MissionControlPane } from "@/components/mission-control/MissionControlPane";
import { CopilotPane } from "@/components/copilot/CopilotPane";
import { TriggerModal } from "@/components/TriggerModal";
import { useDemoController } from "@/lib/hooks/useDemoController";

export default function Home() {
  const { state, sendTrigger, confirmOffer, modifyOffer, approveQueueItem, declineQueueItem, reset } =
    useDemoController();
  const [triggerOpen, setTriggerOpen] = useState(false);

  const isActive = state.phase !== "idle";
  // Pristine = no trigger has ever been sent in this session. The halo on the
  // Send trigger button is meant to onboard first-time viewers; once they
  // have engaged the demo even once, the halo retires.
  const pristine = state.auditLog.length === 0 && !state.startedAt;

  return (
    <>
      <div className="hidden lg:flex flex-col flex-1 min-h-0">
        <AppHeader
          onTriggerClick={() => setTriggerOpen(true)}
          onReset={reset}
          isActive={isActive}
          pristine={pristine}
        />

        <main className="flex-1 grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] min-h-0 bg-[color:color-mix(in_oklch,var(--color-surface-page)_88%,white)]">
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
        </main>

        <AppFooter />
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
        onSend={(payload) => sendTrigger(payload)}
      />
    </>
  );
}

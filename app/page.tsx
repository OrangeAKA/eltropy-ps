"use client";

import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { MissionControlPane } from "@/components/mission-control/MissionControlPane";
import { CopilotPane } from "@/components/copilot/CopilotPane";
import { TriggerModal } from "@/components/TriggerModal";
import { useDemoController } from "@/lib/hooks/useDemoController";

export default function Home() {
  const { state, sendTrigger, confirmOffer, modifyOffer, reset } =
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

        <main className="flex-1 grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] min-h-0">
          <MissionControlPane state={state} />
          <CopilotPane
            state={state}
            onConfirm={confirmOffer}
            onModify={modifyOffer}
          />
        </main>

        <AppFooter />
      </div>

      {/* Mobile / small viewport fallback */}
      <div className="lg:hidden flex-1 flex flex-col items-center justify-center p-6 text-center bg-neutral-50">
        <div className="max-w-md">
          <h1 className="text-lg font-semibold mb-2">
            Eltropy Mission Control
          </h1>
          <p className="text-sm text-neutral-600 mb-4">
            This prototype is designed for desktop viewing. The split-screen
            Mission Control + Copilot layout requires at least 1024px of width.
          </p>
          <p className="text-xs text-neutral-500">
            Please open this URL on a laptop or larger display.
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

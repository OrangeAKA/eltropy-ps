"use client";

import { useEffect, useRef, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CatalogTab } from "@/components/mission-control/CatalogTab";
import { ComposerTab } from "@/components/mission-control/ComposerTab";
import { RuntimeTab } from "@/components/mission-control/RuntimeTab";
import {
  CatalogGlyph,
  ComposerGlyph,
  RuntimeGlyph,
} from "@/components/shared/TabIcons";
import type { DemoState } from "@/lib/types";

type Props = {
  state: DemoState;
};

export function MissionControlPane({ state }: Props) {
  const [activeTab, setActiveTab] = useState<string>("composer");
  const prevPhase = useRef(state.phase);

  // Auto-switch on phase TRANSITIONS only, never on steady-state.
  // This lets the user freely click Catalog/Runtime in idle without being
  // reset back to Composer on the next render.
  useEffect(() => {
    const wasIdle = prevPhase.current === "idle";
    const isExecuting = state.phase === "executing_skill";
    const justReset = !wasIdle && state.phase === "idle";

    if (wasIdle && isExecuting) {
      setActiveTab("runtime");
    } else if (justReset) {
      setActiveTab("composer");
    }
    prevPhase.current = state.phase;
  }, [state.phase]);

  return (
    <div className="h-full flex flex-col bg-[color:color-mix(in_oklch,var(--color-surface-card)_90%,white)] border-r border-rule-strong">
      <div className="px-3 pt-3 pb-2 border-b border-rule">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <h2 className="font-serif text-[15px] font-medium tracking-[-0.01em]">
              Mission Control
            </h2>
            <p className="mt-0.5 max-w-[36ch] text-[11px] leading-snug text-neutral-500">
              Catalog, workflow composition, and the live audit trail in one
              operator surface.
            </p>
          </div>
          <div className="shrink-0 text-right">
            <span className="text-[10px] text-neutral-500 font-mono tabular-nums">
              cyprus-cu · prod
            </span>
            <div className="mt-1 text-[10px] uppercase tracking-[0.12em] text-neutral-400">
              audit-first view
            </div>
          </div>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList variant="line" className="grid grid-cols-3 w-full h-8 px-0">
            <TabsTrigger value="catalog" className="text-xs gap-1.5 rounded-none">
              <CatalogGlyph className="h-3.5 w-3.5" />
              Catalog
            </TabsTrigger>
            <TabsTrigger value="composer" className="text-xs gap-1.5 rounded-none">
              <ComposerGlyph className="h-3.5 w-3.5" />
              Composer
            </TabsTrigger>
            <TabsTrigger value="runtime" className="text-xs gap-1.5 rounded-none">
              <RuntimeGlyph className="h-3.5 w-3.5" />
              Runtime
              {state.auditLog.length > 0 && (
                <span className="rounded-full border border-rule px-1.5 py-px text-[9px] font-mono text-neutral-600">
                  {state.auditLog.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 min-h-0">
        <Tabs value={activeTab} className="h-full">
          <TabsContent value="catalog" className="h-full m-0">
            <CatalogTab />
          </TabsContent>
          <TabsContent value="composer" className="h-full m-0">
            <ComposerTab
              activeSkillId={state.activeSkillId}
              completedSkillIds={state.completedSkillIds}
              workflowId={state.workflowId}
              skillResults={state.context.skillResults}
            />
          </TabsContent>
          <TabsContent value="runtime" className="h-full m-0">
            <RuntimeTab log={state.auditLog} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

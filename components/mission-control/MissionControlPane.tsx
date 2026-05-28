"use client";

import { useEffect, useRef, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CatalogTab } from "@/components/mission-control/CatalogTab";
import { ComposerTab } from "@/components/mission-control/ComposerTab";
import { RuntimeTab } from "@/components/mission-control/RuntimeTab";
import { Boxes, Workflow, Terminal } from "lucide-react";
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
    <div className="h-full flex flex-col bg-white border-r border-neutral-200">
      <div className="px-3 pt-3 pb-1.5 border-b border-neutral-200">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-sm">Mission Control</h2>
          <span className="text-[10px] text-neutral-500 font-mono">
            cyprus-cu · prod
          </span>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-full h-8">
            <TabsTrigger value="catalog" className="text-xs gap-1.5">
              <Boxes className="h-3.5 w-3.5" />
              Catalog
            </TabsTrigger>
            <TabsTrigger value="composer" className="text-xs gap-1.5">
              <Workflow className="h-3.5 w-3.5" />
              Composer
            </TabsTrigger>
            <TabsTrigger value="runtime" className="text-xs gap-1.5">
              <Terminal className="h-3.5 w-3.5" />
              Runtime
              {state.auditLog.length > 0 && (
                <span className="bg-neutral-200 text-neutral-700 rounded px-1 text-[9px] font-mono">
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

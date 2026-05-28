"use client";

import { MemberContextCard } from "@/components/copilot/MemberContextCard";
import { ConversationThread } from "@/components/copilot/ConversationThread";
import { CopilotSidebar } from "@/components/copilot/CopilotSidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { DemoState } from "@/lib/types";
import { Circle } from "lucide-react";

type Props = {
  state: DemoState;
  onConfirm: () => void;
  onModify: () => void;
};

export function CopilotPane({ state, onConfirm, onModify }: Props) {
  return (
    <div className="h-full flex flex-col bg-[color:color-mix(in_oklch,var(--color-surface-card)_92%,white)]">
      {/* Officer identity strip */}
      <div className="px-3 py-2 border-b border-rule flex items-center gap-2">
        <Avatar className="h-6 w-6">
          <AvatarFallback className="bg-brand-50 text-brand-700 text-[10px]">
            SC
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium leading-tight">Sarah Chen</div>
          <div className="text-[10px] text-neutral-500 leading-tight">
            Senior Loan Officer · Cyprus CU
          </div>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-brand-700">
          <Circle className="h-2 w-2 fill-brand-500 text-brand-500" />
          Online
        </div>
      </div>

      {state.context.member && (
        <div className="p-3 border-b border-rule bg-[color:color-mix(in_oklch,var(--color-brand-50)_22%,white)]">
          <MemberContextCard member={state.context.member} />
        </div>
      )}

      <div className="flex-1 grid grid-cols-[1fr_320px] min-h-0">
        <div className="min-h-0 border-r border-rule">
          <ConversationThread
            messages={state.conversationMessages}
            channel={state.context.trigger?.channel}
          />
        </div>
        <div className="min-h-0">
          <CopilotSidebar
            state={state}
            onConfirm={onConfirm}
            onModify={onModify}
          />
        </div>
      </div>
    </div>
  );
}

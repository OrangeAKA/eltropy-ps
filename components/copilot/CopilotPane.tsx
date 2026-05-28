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
    <div className="h-full flex flex-col bg-white">
      {/* Officer identity strip */}
      <div className="px-3 py-2 border-b border-neutral-200 flex items-center gap-2">
        <Avatar className="h-6 w-6">
          <AvatarFallback className="bg-emerald-100 text-emerald-700 text-[10px]">
            SC
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium leading-tight">Sarah Chen</div>
          <div className="text-[10px] text-neutral-500 leading-tight">
            Senior Loan Officer · Cyprus CU
          </div>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-emerald-700">
          <Circle className="h-2 w-2 fill-emerald-500 text-emerald-500" />
          Online
        </div>
      </div>

      {state.context.member && (
        <div className="p-3 border-b border-neutral-200">
          <MemberContextCard member={state.context.member} />
        </div>
      )}

      <div className="flex-1 grid grid-cols-[1fr_320px] min-h-0">
        <div className="min-h-0 border-r border-neutral-200">
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

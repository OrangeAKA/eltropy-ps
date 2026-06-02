"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Clock, ArrowRightLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { QueuedTransferItem } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  items: QueuedTransferItem[];
  onApprove: (itemId: string) => void;
  onDecline: (itemId: string) => void;
};

function useElapsed(queuedAt: number): string {
  const now = Date.now();
  const seconds = Math.floor((now - queuedAt) / 1000);
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

function QueueItemCard({
  item,
  onApprove,
  onDecline,
}: {
  item: QueuedTransferItem;
  onApprove: (id: string) => void;
  onDecline: (id: string) => void;
}) {
  const elapsed = useElapsed(item.queuedAt);
  const authLabel: Record<QueuedTransferItem["authMethod"], string> = {
    verbal_on_voice: "Verbal · recorded line",
    push_approval: "Push approved",
    sms_otp: "SMS OTP",
    secure_link: "Secure link",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4, scale: 0.98 }}
      transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
    >
      <Card className="gap-2 p-3 border-amber-200 bg-[color:color-mix(in_oklch,var(--color-surface-card)_88%,white)]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <ArrowRightLeft className="h-3.5 w-3.5 text-amber-700 shrink-0" />
            <span className="text-xs font-semibold text-neutral-900">
              {item.memberName}
            </span>
            <Badge
              variant="outline"
              className="h-4 rounded-full border-amber-200 bg-amber-50 px-1.5 text-[9px] uppercase tracking-[0.1em] text-amber-800"
            >
              pending
            </Badge>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-mono text-neutral-500">
            <Clock className="h-3 w-3" />
            {elapsed}
          </div>
        </div>

        <div className="rounded-lg border border-rule bg-white px-2.5 py-2">
          <div className="font-mono text-base font-semibold tabular-nums text-neutral-900">
            ${item.amount.toLocaleString()}
          </div>
          <div className="mt-0.5 text-[11px] text-neutral-600">
            {item.fromAccountType} → {item.toAccountType}
            {item.fromAccountId && (
              <span className="ml-1 font-mono text-[10px] text-neutral-400">
                ({item.fromAccountId})
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-neutral-600">
          <ShieldCheck className="h-3 w-3 text-brand-600 shrink-0" />
          <span>Member auth: {authLabel[item.authMethod]}</span>
        </div>

        {item.policyDecision.citations.length > 0 && (
          <div className="text-[10px] font-mono text-neutral-500 truncate">
            {item.policyDecision.citations.join(" · ")}
          </div>
        )}

        <div className="mt-1 flex gap-1.5">
          <Button
            size="sm"
            className={cn(
              "h-7 flex-1 gap-1.5 text-[11px]",
              "bg-brand-700 hover:bg-brand-800",
            )}
            onClick={() => onApprove(item.id)}
          >
            <Check className="h-3 w-3" />
            Approve transfer
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1.5 text-[11px] border-rule hover:border-rose-300 hover:text-rose-700"
            onClick={() => onDecline(item.id)}
          >
            <X className="h-3 w-3" />
            Decline
          </Button>
        </div>

        <p className="text-[9px] leading-snug text-neutral-400">
          Your officer ID + timestamp will be written to the audit log on action.
          This request will not execute unless you approve it.
        </p>
      </Card>
    </motion.div>
  );
}

export function PendingActionsQueue({ items, onApprove, onDecline }: Props) {
  const pendingItems = items.filter((i) => i.status === "pending");

  return (
    <AnimatePresence>
      {pendingItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.24, ease: [0.25, 1, 0.5, 1] }}
          className="overflow-hidden border-b border-amber-200 bg-[color:color-mix(in_oklch,var(--color-surface-card)_94%,oklch(0.85_0.07_85))]"
        >
          <div className="px-3 pt-2.5 pb-2">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-amber-800">
                  Officer queue
                </span>
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-600 text-[9px] font-bold text-white">
                  {pendingItems.length}
                </span>
              </div>
              <span className="text-[10px] text-neutral-500">
                Requires your action before execution
              </span>
            </div>
            <div className="space-y-2">
              {pendingItems.map((item) => (
                <QueueItemCard
                  key={item.id}
                  item={item}
                  onApprove={onApprove}
                  onDecline={onDecline}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

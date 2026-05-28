"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Member } from "@/data/members";

type Props = { member?: Member };

const TIER_COLOR: Record<Member["memberTier"], string> = {
  prime: "bg-emerald-50 text-emerald-700 border-emerald-200",
  standard: "bg-blue-50 text-blue-700 border-blue-200",
  "sub-prime": "bg-amber-50 text-amber-700 border-amber-200",
};

export function MemberContextCard({ member }: Props) {
  return (
    <AnimatePresence mode="wait">
      {member ? (
        <motion.div
          key="resolved"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-3 gap-2">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarFallback className="bg-blue-100 text-blue-700 text-sm">
                  {member.fullName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium text-sm leading-tight truncate">
                      {member.fullName}
                    </div>
                    <div className="text-[11px] text-neutral-500 font-mono tabular-nums">
                      ID {member.id} · {member.address.city}, {member.address.state}
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn("text-[10px] uppercase", TIER_COLOR[member.memberTier])}
                  >
                    {member.memberTier}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2 text-[11px]">
                  <Stat label="Tenure">
                    <span className="font-mono tabular-nums">{member.tenureYears.toFixed(1)}y</span>
                  </Stat>
                  <Stat label="FICO">
                    <span className="font-mono tabular-nums font-medium">{member.fico}</span>
                  </Stat>
                  <Stat label="Products">
                    <span className="font-mono tabular-nums">{member.products.length}</span>
                  </Stat>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {member.products.map((p) => (
                    <Badge
                      key={p.accountId}
                      variant="secondary"
                      className="text-[9px] px-1.5 py-0 font-mono tabular-nums gap-1"
                    >
                      {productIcon(p.type)}
                      {p.type.replace("_", " ")}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-wide text-neutral-500">
        {label}
      </div>
      <div>{children}</div>
    </div>
  );
}

function productIcon(type: string) {
  if (type === "checking" || type === "savings")
    return <Wallet className="h-2.5 w-2.5" />;
  return <TrendingUp className="h-2.5 w-2.5" />;
}

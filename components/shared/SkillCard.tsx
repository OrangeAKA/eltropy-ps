"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, Lock, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { VendorMonogram } from "@/components/shared/VendorMonogram";
import type { Skill } from "@/data/skills";

type SkillCardProps = {
  skill: Skill;
  variant?: "catalog" | "composer" | "compact";
  state?: "idle" | "running" | "completed" | "blocked";
  onClick?: () => void;
  icon?: LucideIcon;
};

const PUBLISHER_LABEL: Record<Skill["publisher"], string> = {
  eltropy: "Eltropy",
  akuvo: "Akuvo",
  meridianlink: "MeridianLink",
  velera: "Velera",
  verafin: "Verafin",
};

const PUBLISHER_COLOR: Record<Skill["publisher"], string> = {
  eltropy: "bg-brand-50 text-brand-700 border-brand-200",
  akuvo: "bg-[color:color-mix(in_oklch,var(--color-brand-50)_40%,white)] text-neutral-700 border-rule-strong",
  meridianlink: "bg-[color:color-mix(in_oklch,var(--color-brand-50)_56%,white)] text-neutral-700 border-rule-strong",
  velera: "bg-[color:color-mix(in_oklch,var(--color-brand-50)_48%,white)] text-neutral-700 border-rule-strong",
  verafin: "bg-[color:color-mix(in_oklch,var(--color-brand-50)_36%,white)] text-neutral-700 border-rule-strong",
};

export function SkillCard({
  skill,
  variant = "catalog",
  state = "idle",
  onClick,
}: SkillCardProps) {
  const isPlaceholder = skill.status === "coming_soon";

  return (
    <Card
      onClick={onClick}
      className={cn(
        "relative cursor-pointer overflow-hidden gap-2 p-4",
        onClick &&
          "hover:border-brand-300 hover:bg-[color:color-mix(in_oklch,var(--color-brand-50)_40%,white)]",
        variant === "compact" && "p-3",
        state === "running" && "border-brand-400 bg-brand-50/80",
        state === "completed" && "border-brand-300 bg-brand-50/55",
        state === "blocked" && "border-amber-300 bg-amber-50/60",
        isPlaceholder && "border-dashed bg-[color:color-mix(in_oklch,var(--color-brand-50)_30%,white)]",
      )}
    >
      {/* Running pulse overlay */}
      <AnimatePresence>
        {state === "running" && (
          <motion.div
            className="pointer-events-none absolute inset-0 bg-brand-500/5"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>

      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-2 min-w-0">
          {state === "running" && (
            <Loader2 className="h-4 w-4 text-brand-600 animate-spin shrink-0" />
          )}
          {state === "completed" && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
              className="shrink-0"
            >
              <Check className="h-4 w-4 text-emerald-600" />
            </motion.span>
          )}
          {isPlaceholder && (
            <Lock className="h-4 w-4 text-neutral-400 shrink-0" />
          )}
          {state === "idle" && !isPlaceholder && (
            <VendorMonogram
              vendor={skill.publisher}
              className="h-4 w-4 text-[8px] shrink-0"
            />
          )}
          {state === "idle" && isPlaceholder && (
            <VendorMonogram
              vendor={skill.publisher}
              className="h-4 w-4 text-[8px] shrink-0 opacity-70"
            />
          )}
          <h3
            className={cn(
              "font-medium leading-tight text-sm truncate",
              isPlaceholder && "text-neutral-600",
            )}
          >
            {skill.name}
          </h3>
        </div>
      </div>

      {variant !== "compact" && (
        <p className="mb-2 text-xs leading-snug text-neutral-600 line-clamp-2">
          {skill.description}
        </p>
      )}

      <div className="flex items-center justify-between gap-2 mt-1">
        <Badge
          variant="outline"
          className={cn("text-[10px] px-1.5 py-0", PUBLISHER_COLOR[skill.publisher])}
        >
          {PUBLISHER_LABEL[skill.publisher]}
        </Badge>
        <div className="flex items-center gap-1.5">
          {isPlaceholder ? (
            <span className="text-[10px] italic text-neutral-500">
              Coming v1.1
            </span>
          ) : (
            <>
              <span className="text-[10px] text-neutral-500 font-mono">
                v{skill.version}
              </span>
              {skill.regulatoryTags.slice(0, 2).map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-[9px] px-1 py-0 font-mono"
                >
                  {tag}
                </Badge>
              ))}
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

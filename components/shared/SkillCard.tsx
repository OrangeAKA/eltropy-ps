"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, Lock, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
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
  eltropy: "bg-blue-50 text-blue-700 border-blue-200",
  akuvo: "bg-purple-50 text-purple-700 border-purple-200",
  meridianlink: "bg-emerald-50 text-emerald-700 border-emerald-200",
  velera: "bg-amber-50 text-amber-700 border-amber-200",
  verafin: "bg-rose-50 text-rose-700 border-rose-200",
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
        "p-4 transition cursor-pointer relative overflow-hidden gap-2",
        onClick && "hover:shadow-md hover:border-neutral-400",
        variant === "compact" && "p-3",
        state === "running" &&
          "border-blue-500 shadow-[0_0_0_3px_rgba(59,130,246,0.15)]",
        state === "completed" && "border-emerald-500",
        state === "blocked" && "border-amber-500",
        isPlaceholder && "border-dashed bg-neutral-50",
      )}
    >
      {/* Running pulse overlay */}
      <AnimatePresence>
        {state === "running" && (
          <motion.div
            className="absolute inset-0 bg-blue-500/5 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
        )}
      </AnimatePresence>

      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-2 min-w-0">
          {state === "running" && (
            <Loader2 className="h-4 w-4 text-blue-600 animate-spin shrink-0" />
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
        <p className="text-xs text-neutral-600 leading-snug line-clamp-2 mb-2">
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
            <span className="text-[10px] text-neutral-500 italic">
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

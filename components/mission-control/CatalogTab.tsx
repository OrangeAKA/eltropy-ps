"use client";

import { useState } from "react";
import { skills, type Skill } from "@/data/skills";
import { SkillCard } from "@/components/shared/SkillCard";
import { SkillDetailModal } from "@/components/mission-control/SkillDetailModal";
import { ScrollArea } from "@/components/ui/scroll-area";

export function CatalogTab() {
  const [selected, setSelected] = useState<Skill | null>(null);
  const [open, setOpen] = useState(false);

  const installed = skills.filter((s) => s.status === "installed");
  const marketplace = skills.filter((s) => s.status === "coming_soon");

  const handleClick = (s: Skill) => {
    setSelected(s);
    setOpen(true);
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        <section className="space-y-2">
          <p className="max-w-[58ch] text-[12px] leading-relaxed text-neutral-600">
            Skills are grouped by what is already installed versus what will
            enter the Agent Exchange next. Open any listing to inspect
            integrations, schema shape, and regulatory tags before it enters a
            workflow.
          </p>
        </section>

        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-600">
              Installed skills · Eltropy-authored
            </h3>
            <span className="rounded-full border border-rule px-2 py-0.5 text-[10px] font-mono text-neutral-500">
              {installed.length}
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            {installed.map((s) => (
              <SkillCard key={s.id} skill={s} onClick={() => handleClick(s)} />
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-600">
              Agent Exchange · Coming soon
            </h3>
            <span className="rounded-full border border-rule px-2 py-0.5 text-[10px] font-mono text-neutral-500">
              {marketplace.length}
            </span>
          </div>
          <p className="mb-2 max-w-[58ch] text-[11px] leading-relaxed text-neutral-500">
            Skills published by fintech partners on Eltropy&apos;s harness.
            Subscribe per execution with Eltropy maintaining the policy,
            identity, and audit boundary.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            {marketplace.map((s) => (
              <SkillCard key={s.id} skill={s} onClick={() => handleClick(s)} />
            ))}
          </div>
        </section>
      </div>

      <SkillDetailModal skill={selected} open={open} onOpenChange={setOpen} />
    </ScrollArea>
  );
}

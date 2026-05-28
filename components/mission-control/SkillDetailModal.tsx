"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Lock, Zap } from "lucide-react";
import type { Skill } from "@/data/skills";

type Props = {
  skill: Skill | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const PUBLISHER_LABEL: Record<Skill["publisher"], string> = {
  eltropy: "Eltropy",
  akuvo: "Akuvo, Inc.",
  meridianlink: "MeridianLink",
  velera: "Velera",
  verafin: "Verafin (Nasdaq)",
};

export function SkillDetailModal({ skill, open, onOpenChange }: Props) {
  if (!skill) return null;

  const isPlaceholder = skill.status === "coming_soon";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            {isPlaceholder ? (
              <Lock className="h-4 w-4 text-neutral-500" />
            ) : (
              <Zap className="h-4 w-4 text-blue-600" />
            )}
            <DialogTitle className="text-lg">{skill.name}</DialogTitle>
          </div>
          <DialogDescription className="text-sm">
            {isPlaceholder ? (
              <>
                <strong>By {PUBLISHER_LABEL[skill.publisher]}.</strong>{" "}
                Coming to Agent Exchange in v1.1. Compatible with Eltropy
                harness v2.4+.
              </>
            ) : (
              <>
                <strong>{PUBLISHER_LABEL[skill.publisher]}-authored.</strong>{" "}
                Installed and available to deploy.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <p className="text-neutral-700 leading-relaxed">{skill.description}</p>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <DetailBlock label="Version">
              <span className="font-mono text-xs">v{skill.version}</span>
            </DetailBlock>
            <DetailBlock label="Avg runtime">
              <span className="font-mono text-xs">{skill.avgRuntimeMs}ms</span>
            </DetailBlock>
            <DetailBlock label="Category">
              <Badge variant="outline" className="capitalize">
                {skill.category}
              </Badge>
            </DetailBlock>
            <DetailBlock label="Status">
              <Badge
                variant={isPlaceholder ? "secondary" : "default"}
                className="capitalize"
              >
                {skill.status.replace("_", " ")}
              </Badge>
            </DetailBlock>
          </div>

          <Separator />

          <DetailBlock label="Required integrations">
            <div className="flex flex-wrap gap-1.5 mt-1">
              {skill.requiredIntegrations.map((i) => (
                <Badge key={i} variant="outline" className="font-mono text-[10px]">
                  {i}
                </Badge>
              ))}
            </div>
          </DetailBlock>

          <DetailBlock label="Regulatory tags">
            <div className="flex flex-wrap gap-1.5 mt-1">
              {skill.regulatoryTags.map((t) => (
                <Badge key={t} variant="secondary" className="font-mono text-[10px]">
                  {t}
                </Badge>
              ))}
            </div>
          </DetailBlock>

          <Separator />

          <DetailBlock label="Inputs">
            <ul className="mt-1 space-y-1">
              {skill.inputs.map((i) => (
                <li
                  key={i.name}
                  className="font-mono text-[11px] text-neutral-700"
                >
                  <span className="text-blue-700">{i.name}</span>
                  <span className="text-neutral-400">: </span>
                  <span className="text-neutral-700">{i.type}</span>
                  {i.required && (
                    <span className="text-rose-600 ml-1">*</span>
                  )}
                </li>
              ))}
            </ul>
          </DetailBlock>

          <DetailBlock label="Outputs">
            <ul className="mt-1 space-y-1">
              {skill.outputs.map((o) => (
                <li
                  key={o.name}
                  className="font-mono text-[11px] text-neutral-700"
                >
                  <span className="text-emerald-700">{o.name}</span>
                  <span className="text-neutral-400">: </span>
                  <span className="text-neutral-700">{o.type}</span>
                </li>
              ))}
            </ul>
          </DetailBlock>

          {isPlaceholder && (
            <>
              <Separator />
              <div className="bg-neutral-50 border border-neutral-200 rounded-md p-3 text-xs">
                <p className="font-medium text-neutral-800 mb-1">
                  Marketplace listing
                </p>
                <p className="text-neutral-600">
                  Subscribe to this skill on launch.{" "}
                  <span className="font-mono text-neutral-700">
                    $0.08/execution
                  </span>{" "}
                  · billed monthly · Eltropy take-rate 20%
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-neutral-500 font-medium">
        {label}
      </div>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}

import type { ReactNode } from "react";
import type { UnitStatus } from "@/models";
import { cn } from "@/lib/utils";
import { unitStatusLabels } from "@/lib/format";

type Tone =
  | "ink"
  | "outline"
  | "accent"
  | "paper"
  | "available"
  | "reserved"
  | "sold"
  | "dark"
  | "amber";

const tones: Record<Tone, string> = {
  ink: "bg-ink text-paper",
  outline: "border border-line text-muted",
  accent: "bg-accent-soft text-accent-strong",
  paper: "bg-paper text-ink",
  available: "bg-forest-soft text-forest",
  reserved: "bg-amber-soft text-amber",
  sold: "bg-paper-deep text-muted",
  dark: "border border-stage-line text-paper/80",
  amber: "bg-amber-soft text-amber",
};

export function Badge({
  children,
  tone = "outline",
  className,
  dot,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[2px] px-2 py-1 font-mono text-[9px] uppercase leading-none tracking-[0.16em]",
        tones[tone],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function UnitStatusBadge({
  status,
  className,
}: {
  status: UnitStatus;
  className?: string;
}) {
  const tone =
    status === "available"
      ? "available"
      : status === "reserved"
        ? "reserved"
        : "sold";
  return (
    <Badge tone={tone} dot className={className}>
      {unitStatusLabels[status]}
    </Badge>
  );
}

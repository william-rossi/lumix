import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionHeading({
  index,
  eyebrow,
  title,
  description,
  actions,
  tone = "ink",
  className,
  align = "left",
}: {
  index?: string;
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  tone?: "ink" | "paper" | "stage";
  className?: string;
  align?: "left" | "center";
}) {
  const isDark = tone === "paper" || tone === "stage";
  return (
    <div
      className={cn(
        "flex flex-col gap-6 md:flex-row md:items-end md:justify-between",
        align === "center" && "md:flex-col md:items-center md:text-center",
        className,
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "flex flex-col items-center")}>
        {(eyebrow || index) && (
          <div className="flex items-center gap-3">
            {index && (
              <span className="font-mono text-[10px] tracking-[0.18em] text-accent">
                {index}
              </span>
            )}
            <span
              className={cn(
                "h-px w-8",
                isDark ? "bg-paper/30" : "bg-line-strong",
              )}
            />
            {eyebrow && (
              <span className={cn("eyebrow", isDark ? "text-paper/60" : "text-muted")}>
                {eyebrow}
              </span>
            )}
          </div>
        )}
        <h2
          className={cn(
            "mt-4 text-balance",
            "display-md",
            isDark ? "text-paper" : "text-ink",
          )}
        >
          {title}
        </h2>
        {description && (
          <p
            className={cn(
              "mt-4 max-w-xl text-pretty text-[13px] leading-relaxed",
              isDark ? "text-paper/65" : "text-muted",
              align === "center" && "mx-auto",
            )}
          >
            {description}
          </p>
        )}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}

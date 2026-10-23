import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant =
  | "primary"
  | "accent"
  | "outline"
  | "ghost"
  | "dark"
  | "onDark"
  | "paper";

type Size = "sm" | "md" | "lg";

const base =
  "group/button relative inline-flex select-none items-center justify-center gap-2 rounded-[2px] font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-40";

const variants: Record<Variant, string> = {
  primary:
    "bg-ink text-paper hover:bg-accent hover:text-white active:bg-accent-strong",
  accent:
    "bg-accent text-white hover:bg-accent-strong active:bg-accent-strong",
  outline:
    "border border-ink/20 text-ink hover:border-ink hover:bg-ink hover:text-paper",
  ghost: "text-ink hover:text-accent",
  dark: "bg-ink text-paper hover:bg-ink-soft",
  onDark:
    "border border-stage-line bg-transparent text-paper hover:border-paper hover:bg-paper hover:text-ink",
  paper: "bg-paper text-ink hover:bg-white",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-[12px] tracking-wide",
  md: "h-11 px-5 text-[13px] tracking-wide",
  lg: "h-13 px-7 text-sm tracking-wide",
};

export function buttonStyles({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: Variant;
  size?: Size;
  className?: string;
} = {}) {
  return cn(base, variants[variant], sizes[size], className);
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
}) {
  return (
    <button className={buttonStyles({ variant, size, className })} {...props} />
  );
}

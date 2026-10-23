import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const fieldBase =
  "w-full bg-transparent text-sm text-ink placeholder:text-muted/60 focus:outline-none disabled:opacity-50";

const line =
  "border-0 border-b border-line py-2.5 transition-colors focus:border-ink";

const boxed =
  "h-11 rounded-[2px] border border-line bg-paper-raised px-3 transition-colors focus:border-ink";

export function Label({
  children,
  className,
  htmlFor,
}: {
  children: ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn("eyebrow block text-muted", className)}
    >
      {children}
    </label>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
  className,
  htmlFor,
}: {
  label?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && <Label htmlFor={htmlFor}>{label}</Label>}
      {children}
      {hint && !error && (
        <p className="text-[11px] leading-relaxed text-muted">{hint}</p>
      )}
      {error && (
        <p className="text-[11px] leading-relaxed text-accent-strong">{error}</p>
      )}
    </div>
  );
}

export function Input({
  className,
  variant = "line",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  variant?: "line" | "boxed";
}) {
  return (
    <input
      className={cn(fieldBase, variant === "line" ? line : boxed, className)}
      {...props}
    />
  );
}

export function Textarea({
  className,
  variant = "line",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  variant?: "line" | "boxed";
}) {
  return (
    <textarea
      className={cn(
        fieldBase,
        "resize-none",
        variant === "line" ? `${line} min-h-24` : `${boxed} h-auto min-h-28 py-2.5`,
        className,
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  variant = "line",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  variant?: "line" | "boxed";
}) {
  return (
    <div className="relative">
      <select
        className={cn(
          fieldBase,
          "cursor-pointer appearance-none pr-8",
          variant === "line" ? line : boxed,
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        strokeWidth={1.5}
      />
    </div>
  );
}

export function Checkbox({
  label,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode }) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-2.5 text-[12px] leading-relaxed text-muted", className)}>
      <input
        type="checkbox"
        className="mt-0.5 h-3.5 w-3.5 shrink-0 appearance-none rounded-[1px] border border-line-strong bg-transparent checked:border-ink checked:bg-ink"
        {...props}
      />
      <span>{label}</span>
    </label>
  );
}

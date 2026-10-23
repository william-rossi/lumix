import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 30"
      fill="none"
      aria-hidden="true"
      className={cn("h-6 w-auto", className)}
    >
      <path
        d="M14 1.6 26 8.4v13.2L14 28.4 2 21.6V8.4L14 1.6Z"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path d="M2 8.4 14 15.2l12-6.8M14 15.2v13.2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 4.9v13.2l6 3.4" stroke="currentColor" strokeWidth="1.2" opacity="0.55" />
    </svg>
  );
}

export function Logo({
  className,
  tone = "ink",
  showMark = true,
}: {
  className?: string;
  tone?: "ink" | "paper";
  showMark?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2.5",
        tone === "paper" ? "text-paper" : "text-ink",
        className,
      )}
    >
      {showMark && <BrandMark className="h-[22px] text-accent" />}
      <span className="font-sans text-[13px] font-semibold uppercase leading-none tracking-[0.28em]">
        Lumix
      </span>
    </span>
  );
}

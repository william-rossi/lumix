import type { ReactNode } from "react";
import Link from "next/link";
import { developmentPath } from "@/lib/utils";

export function DevelopmentLink({
  slug,
  children,
  className,
  ariaLabel,
}: {
  slug: string;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}) {
  const href = developmentPath(slug);
  if (href.startsWith("http")) {
    return (
      <a href={href} className={className} aria-label={ariaLabel}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}

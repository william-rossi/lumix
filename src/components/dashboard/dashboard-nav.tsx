"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  LayoutDashboard,
  Settings,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/painel", label: "Visão geral", icon: LayoutDashboard, exact: true },
  {
    href: "/painel/empreendimentos",
    label: "Empreendimentos",
    icon: Building2,
    exact: false,
  },
  { href: "/painel/leads", label: "Leads", icon: Users, exact: false },
  {
    href: "/painel/configuracoes",
    label: "Configurações",
    icon: Settings,
    exact: false,
  },
];

export function DashboardNav({
  tone = "paper",
  compact = false,
}: {
  tone?: "paper" | "ink";
  compact?: boolean;
}) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        compact ? "flex items-center gap-1" : "flex flex-col gap-0.5",
        tone === "ink" ? "text-paper" : "text-ink",
      )}
      aria-label="Painel"
    >
      {items.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 transition-colors",
              compact
                ? "shrink-0 border-b-2 px-3 py-3 font-mono text-[9px] uppercase tracking-[0.14em]"
                : "px-3 py-2.5 text-[12.5px]",
              active
                ? tone === "ink"
                  ? compact
                    ? "border-accent text-paper"
                    : "bg-paper/10 text-paper"
                  : compact
                    ? "border-accent text-ink"
                    : "bg-paper-deep text-ink"
                : tone === "ink"
                  ? "border-transparent text-paper/50 hover:text-paper"
                  : "border-transparent text-muted hover:text-ink",
            )}
          >
            <item.icon
              className={cn(
                compact ? "hidden" : "h-4 w-4",
                active
                  ? tone === "ink"
                    ? "text-accent"
                    : "text-accent"
                  : tone === "ink"
                    ? "text-paper/35"
                    : "text-muted/70",
              )}
              strokeWidth={1.5}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

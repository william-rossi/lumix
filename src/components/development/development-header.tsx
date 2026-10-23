import Link from "next/link";
import { ArrowUpRight, Phone } from "lucide-react";
import type { Agency, Development } from "@/models";
import { BrandMark } from "@/components/ui/logo";
import { buttonStyles } from "@/components/ui/button";
import { initials } from "@/lib/utils";

const anchors = [
  { href: "#explorar", label: "Unidades" },
  { href: "#sobre", label: "O prédio" },
  { href: "#galeria", label: "Galeria" },
  { href: "#localizacao", label: "Localização" },
];

export function DevelopmentHeader({
  development,
  agency,
}: {
  development: Development;
  agency: Agency;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur-[2px]">
      <div className="container-editorial flex h-16 items-center justify-between gap-4">
        <Link
          href={`/imobiliarias/${agency.slug}`}
          className="flex min-w-0 items-center gap-2.5"
          aria-label={`Perfil da ${agency.name}`}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-line font-display text-[11px] text-ink">
            {initials(agency.name)}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[12px] leading-tight text-ink">
              {agency.name}
            </span>
            <span className="block font-mono text-[8px] uppercase tracking-[0.14em] text-muted">
              {agency.creci}
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Seções">
          {anchors.map((anchor) => (
            <a
              key={anchor.href}
              href={anchor.href}
              className="link-underline text-[12px] text-ink-soft transition-colors hover:text-ink"
            >
              {anchor.label}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          <a
            href={`tel:${agency.phone.replace(/\s/g, "")}`}
            className="hidden items-center gap-1.5 text-[11px] text-muted transition-colors hover:text-ink xl:flex"
          >
            <Phone className="h-3.5 w-3.5" strokeWidth={1.5} />
            {agency.phone}
          </a>
          <Link
            href="#contato"
            className={buttonStyles({ variant: "accent", size: "sm" })}
          >
            Falar com corretor
            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.75} />
          </Link>
        </div>
      </div>

      <div className="border-t border-line/70">
        <div className="container-editorial flex h-9 items-center justify-between gap-4">
          <p className="truncate font-mono text-[8.5px] uppercase tracking-[0.18em] text-muted">
            {development.name} · {development.address.city}
          </p>
          <Link
            href="/"
            className="flex shrink-0 items-center gap-1.5 font-mono text-[8.5px] uppercase tracking-[0.16em] text-muted transition-colors hover:text-ink"
            aria-label="Conheça a Lumix"
          >
            <BrandMark className="h-3 w-auto text-accent" />
            por Lumix
          </Link>
        </div>
      </div>
    </header>
  );
}

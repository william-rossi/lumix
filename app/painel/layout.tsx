import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  LifeBuoy,
  LogOut,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { agencies, developments } from "@/data/seed";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { Logo } from "@/components/ui/logo";
import { buttonStyles } from "@/components/ui/button";
import { initials } from "@/lib/utils";

export const metadata: Metadata = {
  title: {
    default: "Painel",
    template: "%s · Painel LUMIX",
  },
  description:
    "Gerencie empreendimentos, unidades, maquetes 3D e leads da sua imobiliária.",
};

export default function PanelLayout({ children }: { children: ReactNode }) {
  const agency = agencies[0];
  const primaryDevelopment = developments.find(
    (development) => development.agencyId === agency.id,
  );

  return (
    <div className="min-h-screen bg-paper">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-stage-line bg-ink text-paper lg:flex">
        <div className="flex h-16 items-center border-b border-paper/10 px-5">
          <Link href="/painel" aria-label="Painel LUMIX">
            <Logo tone="paper" />
          </Link>
        </div>

        <div className="border-b border-paper/10 px-5 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-paper/20 font-display text-xs text-paper">
              {initials(agency.name)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[12px] text-paper">{agency.name}</p>
              <p className="mt-0.5 flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.12em] text-paper/40">
                <span className="h-1 w-1 rounded-full bg-amber" />
                Conta demonstrativa
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-5">
          <p className="px-3 font-mono text-[8px] uppercase tracking-[0.18em] text-paper/25">
            Operação
          </p>
          <div className="mt-2">
            <Suspense fallback={<div className="h-36" />}>
              <DashboardNav tone="ink" />
            </Suspense>
          </div>

          <div className="mt-6 border-t border-paper/10 pt-4">
            <p className="px-3 font-mono text-[8px] uppercase tracking-[0.18em] text-paper/25">
              Atalhos
            </p>
            <div className="mt-2 flex flex-col gap-0.5">
              <Link
                href="/painel/empreendimentos/novo"
                className="flex items-center gap-2.5 px-3 py-2 text-[12px] text-paper/50 transition-colors hover:text-paper"
              >
                <Plus className="h-3.5 w-3.5 text-paper/30" strokeWidth={1.5} />
                Novo empreendimento
              </Link>
              {primaryDevelopment && (
                <Link
                  href={`/sites/${primaryDevelopment.slug}`}
                  className="flex items-center gap-2.5 px-3 py-2 text-[12px] text-paper/50 transition-colors hover:text-paper"
                >
                  <ArrowUpRight
                    className="h-3.5 w-3.5 text-paper/30"
                    strokeWidth={1.5}
                  />
                  Ver site publicado
                </Link>
              )}
              <a
                href="mailto:suporte@lumix.com.br"
                className="flex items-center gap-2.5 px-3 py-2 text-[12px] text-paper/50 transition-colors hover:text-paper"
              >
                <LifeBuoy className="h-3.5 w-3.5 text-paper/30" strokeWidth={1.5} />
                Falar com suporte
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-paper/10 p-4">
          <div className="flex items-center gap-2.5 border border-paper/10 px-3 py-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft font-mono text-[10px] text-accent-strong">
              MA
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] text-paper">Marina Almeida</p>
              <p className="font-mono text-[7.5px] uppercase tracking-[0.12em] text-paper/35">
                Administradora
              </p>
            </div>
            <Link
              href="/entrar"
              aria-label="Sair"
              className="text-paper/35 transition-colors hover:text-paper"
            >
              <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} />
            </Link>
          </div>
          <p className="mt-3 flex items-center gap-1.5 font-mono text-[7px] uppercase tracking-[0.12em] text-paper/20">
            <ShieldCheck className="h-3 w-3" strokeWidth={1.5} />
            Ambiente de demonstração
          </p>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur-[2px]">
          <div className="flex h-16 items-center justify-between gap-4 px-5 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <Link href="/painel" className="lg:hidden">
                <Logo />
              </Link>
              <div className="hidden min-w-0 sm:block">
                <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted/60">
                  Painel · {agency.name}
                </p>
                <p className="mt-0.5 truncate text-[12px] text-ink">
                  {agency.address.city} / {agency.address.state}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2.5">
              <span className="hidden items-center gap-1.5 border border-amber/25 bg-amber-soft px-2 py-1 font-mono text-[7.5px] uppercase tracking-[0.14em] text-amber sm:flex">
                Demo
              </span>
              {primaryDevelopment && (
                <Link
                  href={`/sites/${primaryDevelopment.slug}`}
                  className={buttonStyles({
                    variant: "outline",
                    size: "sm",
                    className: "hidden sm:inline-flex",
                  })}
                >
                  Ver site
                  <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.75} />
                </Link>
              )}
              <Link
                href="/painel/empreendimentos/novo"
                className={buttonStyles({ size: "sm" })}
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
                <span className="hidden sm:inline">Novo empreendimento</span>
                <span className="sm:hidden">Novo</span>
              </Link>
            </div>
          </div>

          <div className="no-scrollbar overflow-x-auto border-t border-line lg:hidden">
            <div className="flex min-w-max px-2">
              <Suspense fallback={<div className="h-10 w-72" />}>
                <DashboardNav compact />
              </Suspense>
            </div>
          </div>
        </header>

        <main className="px-5 py-7 lg:px-8 lg:py-9">{children}</main>
      </div>
    </div>
  );
}

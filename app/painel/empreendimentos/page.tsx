import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import {
  ArrowUpRight,
  Box,
  Building2,
  Copy,
  Plus,
} from "lucide-react";
import { agencies } from "@/data/seed";
import { listDevelopments, listLeads } from "@/lib/db/repository";
import { Badge } from "@/components/ui/badge";
import { UnitMix } from "@/components/dashboard/unit-mix";
import {
  developmentStatusLabels,
  formatBRL,
  formatNumber,
} from "@/lib/format";
import { developmentHost } from "@/lib/utils";

export const instant = false;

const statusTone = {
  launching: "accent",
  under_construction: "amber",
  ready: "available",
  sold_out: "sold",
} as const;

export default async function DevelopmentsPage() {
  await connection();
  const agency = agencies[0];
  const agencyDevelopments = await listDevelopments({
    agencyId: agency.id,
    includeDrafts: true,
  });
  const units = agencyDevelopments.flatMap((development) => development.units);
  const available = units.filter((unit) => unit.status === "available").length;
  const agencyLeads = (await listLeads()).filter((lead) =>
    agencyDevelopments.some((development) => development.id === lead.developmentId),
  );

  return (
    <div className="mx-auto max-w-[1360px]">
      <div className="flex flex-col justify-between gap-5 border-b border-line pb-6 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="eyebrow text-muted">Portfólio</span>
            <span className="h-px w-7 bg-line-strong" />
            <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted/60">
              {agencyDevelopments.length} empreendimentos
            </span>
          </div>
          <h1 className="mt-3 font-display text-[clamp(2rem,4vw,3rem)] leading-none text-ink">
            Seus endereços.
          </h1>
          <p className="mt-2 max-w-lg text-[12.5px] leading-relaxed text-muted">
            Cada empreendimento tem uma página pública com maquete, unidades e
            captura de leads. Publique, edite e acompanhe por aqui.
          </p>
        </div>

        <Link
          href="/painel/empreendimentos/novo"
          className="inline-flex h-10 shrink-0 items-center gap-2 bg-ink px-4 font-mono text-[8.5px] uppercase tracking-[0.14em] text-paper transition-colors hover:bg-accent"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
          Novo empreendimento
        </Link>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Empreendimentos", String(agencyDevelopments.length).padStart(2, "0")],
          ["Publicados", String(agencyDevelopments.filter((d) => d.isPublished).length).padStart(2, "0")],
          ["Unidades", formatNumber(units.length)],
          ["Livres", formatNumber(available)],
        ].map(([label, value]) => (
          <div key={label} className="border border-line bg-paper-raised px-4 py-3">
            <dt className="font-mono text-[7.5px] uppercase tracking-[0.14em] text-muted/60">
              {label}
            </dt>
            <dd className="mt-1 font-display text-2xl leading-none text-ink">
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {agencyDevelopments.map((development) => {
          const developmentUnits = development.units;
          const free = developmentUnits.filter(
            (unit) => unit.status === "available",
          ).length;
          const developmentLeads = agencyLeads.filter(
            (lead) => lead.developmentId === development.id,
          ).length;
          return (
            <article
              key={development.id}
              className="flex flex-col border border-line bg-paper-raised transition-colors hover:border-ink/40"
            >
              <div className="relative aspect-[16/8] overflow-hidden border-b border-line bg-paper-deep">
                <Image
                  src={development.coverImage}
                  alt={development.name}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover transition-transform duration-500 hover:scale-[1.02]"
                />
                <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 bg-gradient-to-b from-stage/60 to-transparent p-3">
                  <Badge tone={statusTone[development.status]}>
                    {developmentStatusLabels[development.status]}
                  </Badge>
                  <span className="inline-flex items-center gap-1 bg-stage/70 px-1.5 py-1 font-mono text-[7px] uppercase tracking-[0.12em] text-paper backdrop-blur">
                    <Box className="h-2.5 w-2.5" strokeWidth={1.75} />
                    {development.model3d.storage ? "GLB" : "3D"}
                  </span>
                </div>
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-stage/80 via-stage/20 to-transparent p-3 pt-10">
                  <div className="min-w-0">
                    <p className="font-mono text-[7.5px] lowercase tracking-[0.06em] text-paper/60">
                      {developmentHost(development.slug)}
                    </p>
                    <h2 className="mt-0.5 truncate font-display text-2xl leading-none text-paper">
                      {development.name}
                    </h2>
                  </div>
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center border border-paper/25 text-paper/70"
                    aria-hidden="true"
                  >
                    <Building2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </span>
                </div>
              </div>

              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-muted">
                    {development.address.neighborhood} ·{" "}
                    {development.address.city}/{development.address.state}
                  </p>
                  <p className="shrink-0 font-mono text-[8px] uppercase tracking-[0.1em] text-muted/50">
                    {developmentLeads} leads
                  </p>
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <UnitMix units={developmentUnits} className="w-full max-w-36" />
                  <span className="shrink-0 font-mono text-[8px] uppercase tracking-[0.1em] text-muted">
                    {free}/{developmentUnits.length} livres
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-3">
                  <div>
                    <p className="font-mono text-[7px] uppercase tracking-[0.12em] text-muted/50">
                      A partir
                    </p>
                    <p className="mt-0.5 font-display text-base text-ink">
                      {formatBRL(development.pricing.minPrice)}
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-[7px] uppercase tracking-[0.12em] text-muted/50">
                      Andares
                    </p>
                    <p className="mt-0.5 font-display text-base text-ink">
                      {development.model3d.massing.floors}
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-[7px] uppercase tracking-[0.12em] text-muted/50">
                      Unidades
                    </p>
                    <p className="mt-0.5 font-display text-base text-ink">
                      {developmentUnits.length}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-3">
                  <div className="flex items-center gap-1.5 font-mono text-[7.5px] uppercase tracking-[0.1em] text-muted/50">
                    <Copy className="h-2.5 w-2.5" strokeWidth={1.5} />
                    {development.isPublished ? "no ar" : "rascunho"}
                  </div>
                  <div className="flex items-center gap-3">
                    {development.isPublished ? (
                      <a
                        href={`/sites/${development.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-[7.5px] uppercase tracking-[0.12em] text-muted transition-colors hover:text-ink"
                      >
                        Ver site
                        <ArrowUpRight className="h-3 w-3" strokeWidth={1.75} />
                      </a>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 font-mono text-[7.5px] uppercase tracking-[0.12em] text-muted/50"
                        title="Publique o empreendimento para abrir o site"
                      >
                        Publicar para ver
                      </span>
                    )}
                    <Link
                      href={`/painel/empreendimentos/${development.id}`}
                      className="inline-flex h-8 items-center gap-1 border border-ink bg-ink px-2.5 font-mono text-[7.5px] uppercase tracking-[0.12em] text-paper transition-colors hover:bg-accent"
                    >
                      Editar
                      <ArrowUpRight className="h-3 w-3" strokeWidth={1.75} />
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          );
        })}

        <Link
          href="/painel/empreendimentos/novo"
          className="group flex min-h-72 flex-col items-center justify-center border border-dashed border-line-strong bg-transparent p-8 text-center transition-colors hover:border-ink hover:bg-paper-raised"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-line text-muted transition-colors group-hover:border-ink group-hover:text-ink">
            <Plus className="h-5 w-5" strokeWidth={1.25} />
          </span>
          <p className="mt-4 font-display text-xl text-ink">
            Novo empreendimento
          </p>
          <p className="mt-1 max-w-56 text-[11.5px] leading-relaxed text-muted">
            Cadastre o projeto, gere as unidades e publique a maquete 3D.
          </p>
        </Link>
      </div>

      <p className="mt-8 border border-line bg-paper-raised px-4 py-3 text-[11px] leading-relaxed text-muted">
        Cada projeto ocupa um subdomínio próprio em produção. No ambiente de
        demonstração, os links usam{" "}
        <span className="font-mono text-[10px] text-ink">/sites/[slug]</span>{" "}
        para funcionar sem configuração de DNS.
      </p>
    </div>
  );
}

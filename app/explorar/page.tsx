import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { ArrowUpRight, Search, SlidersHorizontal, X } from "lucide-react";
import { listAgencies, listDevelopments } from "@/lib/db/repository";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { DevelopmentCard } from "@/components/marketing/development-card";
import { AgencyCard } from "@/components/marketing/agency-card";
import { Badge } from "@/components/ui/badge";
import {
  developmentStatusLabels,
  developmentTypeLabels,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DevelopmentStatus, DevelopmentType } from "@/models";

export const metadata: Metadata = {
  title: "Explorar empreendimentos e imobiliárias",
  description:
    "Navegue por empreendimentos com maquete 3D, filtre por estado e conheça as imobiliárias responsáveis.",
};

type Params = Record<string, string | string[] | undefined>;

const STATUS_ORDER: DevelopmentStatus[] = [
  "launching",
  "under_construction",
  "ready",
  "sold_out",
];

const TYPE_ORDER: DevelopmentType[] = [
  "residential",
  "commercial",
  "mixed",
  "land",
];

export default function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen">
        <Suspense fallback={<ExploreFallback />}>
          <ExploreContent searchParams={searchParams} />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}

async function ExploreContent({ searchParams }: { searchParams: Promise<Params> }) {
  await connection();
  const [developments, agencies] = await Promise.all([
    listDevelopments(),
    listAgencies(),
  ]);

  const params = await searchParams;
  const first = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;

  const tab = first(params.tab) === "agencies" ? "agencies" : "developments";
  const state = first(params.state) ?? "";
  const type = first(params.type) ?? "";
  const status = first(params.status) ?? "";
  const query = (first(params.q) ?? "").trim();

  const hasFilters = Boolean(state || type || status || query);

  const href = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const merged: Record<string, string | undefined> = {
      tab,
      state,
      type,
      status,
      q: query,
      ...patch,
    };
    for (const [key, value] of Object.entries(merged)) {
      if (value) next.set(key, value);
    }
    const search = next.toString();
    return `/explorar${search ? `?${search}` : ""}`;
  };

  const filteredDevelopments = developments.filter((development) => {
    if (!development.isPublished) return false;
    if (state && development.address.state !== state) return false;
    if (type && development.type !== type) return false;
    if (status && development.status !== status) return false;
    if (query) {
      const haystack = [
        development.name,
        development.address.neighborhood,
        development.address.city,
        development.address.state,
        development.tagline ?? "",
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query.toLowerCase())) return false;
    }
    return true;
  });

  const agencyPool = agencies.filter((agency) => {
    if (state && agency.address.state !== state) return false;
    if (query) {
      const haystack = [
        agency.name,
        agency.address.neighborhood,
        agency.address.city,
        agency.address.state,
        agency.description,
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query.toLowerCase())) return false;
    }
    return true;
  });

  const states = Array.from(
    new Set(developments.map((development) => development.address.state)),
  ).sort();

  const stateCounts = new Map<string, number>();
  for (const stateCode of states) {
    const count =
      tab === "agencies"
        ? agencies.filter((agency) => agency.address.state === stateCode).length
        : developments.filter((development) => {
            if (!development.isPublished) return false;
            if (development.address.state !== stateCode) return false;
            if (type && development.type !== type) return false;
            if (status && development.status !== status) return false;
            if (query) {
              const haystack = [
                development.name,
                development.address.neighborhood,
                development.address.city,
                development.tagline ?? "",
              ]
                .join(" ")
                .toLowerCase();
              if (!haystack.includes(query.toLowerCase())) return false;
            }
            return true;
          }).length;
    stateCounts.set(stateCode, count);
  }

  const availableUnits = filteredDevelopments.reduce(
    (total, development) =>
      total +
      development.units.filter((unit) => unit.status === "available").length,
    0,
  );

  const cities = Array.from(
    new Set(
      developments.map(
        (development) => `${development.address.city}/${development.address.state}`,
      ),
    ),
  );

  return (
    <>
      {/* Header */}
      <section className="border-b border-line">
        <div className="container-editorial py-12 lg:py-16">
          <div className="grid items-end gap-8 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] tracking-[0.18em] text-accent">
                  D—01
                </span>
                <span className="h-px w-8 bg-line-strong" />
                <span className="eyebrow text-muted">Diretório nacional</span>
              </div>
              <h1 className="mt-5 display-lg text-ink">
                Todos os endereços.
                <br />
                <span className="serif-italic text-accent">Nenhuma pressa.</span>
              </h1>
              <p className="mt-5 max-w-lg text-pretty text-[13.5px] leading-relaxed text-muted">
                Empreendimentos com maquete 3D e imobiliárias independentes.
                Filtre por região, tipologia ou estágio da obra e abra a unidade
                que faz sentido.
              </p>
            </div>

            <div className="lg:col-span-4">
              <dl className="grid grid-cols-3 border-t border-line pt-4">
                <div>
                  <dt className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted/60">
                    Projetos
                  </dt>
                  <dd className="mt-1 font-display text-2xl text-ink">
                    {String(developments.length).padStart(2, "0")}
                  </dd>
                </div>
                <div>
                  <dt className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted/60">
                    Imobiliárias
                  </dt>
                  <dd className="mt-1 font-display text-2xl text-ink">
                    {String(agencies.length).padStart(2, "0")}
                  </dd>
                </div>
                <div>
                  <dt className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted/60">
                    Cidades
                  </dt>
                  <dd className="mt-1 font-display text-2xl text-ink">
                    {String(cities.length).padStart(2, "0")}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="sticky top-16 z-30 border-b border-line bg-paper/95 backdrop-blur-[2px]">
        <div className="container-editorial flex h-14 items-center justify-between gap-6">
          <div className="flex h-full items-stretch gap-1 overflow-x-auto no-scrollbar">
            <Link
              href={href({ tab: "developments", type: undefined, status: undefined })}
              className={cn(
                "flex shrink-0 items-center gap-2 border-b-2 px-1 font-mono text-[9px] uppercase tracking-[0.16em] transition-colors sm:px-3",
                tab === "developments"
                  ? "border-accent text-ink"
                  : "border-transparent text-muted hover:text-ink",
              )}
            >
              Empreendimentos
              <span className="text-[8px] tabular-nums text-muted/50">
                {developments.length}
              </span>
            </Link>
            <Link
              href={href({ tab: "agencies", type: undefined, status: undefined })}
              className={cn(
                "flex shrink-0 items-center gap-2 border-b-2 px-1 font-mono text-[9px] uppercase tracking-[0.16em] transition-colors sm:px-3",
                tab === "agencies"
                  ? "border-accent text-ink"
                  : "border-transparent text-muted hover:text-ink",
              )}
            >
              Imobiliárias
              <span className="text-[8px] tabular-nums text-muted/50">
                {agencies.length}
              </span>
            </Link>
          </div>

          <span className="hidden shrink-0 font-mono text-[8px] uppercase tracking-[0.16em] text-muted/60 sm:block">
            {tab === "developments"
              ? `${filteredDevelopments.length} resultados · ${availableUnits} unidades livres`
              : `${agencyPool.length} resultados`}
          </span>
        </div>
      </div>

      {/* Content */}
      <section className="border-b border-line">
        <div className="container-editorial py-8 lg:py-12">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
            {/* Filters */}
            <aside className="lg:col-span-3">
              <div className="flex items-center gap-2 border-b border-ink pb-2.5">
                <SlidersHorizontal className="h-3.5 w-3.5 text-ink" strokeWidth={1.5} />
                <span className="eyebrow text-ink">Filtros</span>
                {hasFilters && (
                  <Link
                    href={href({ state: undefined, type: undefined, status: undefined, q: undefined })}
                    className="ml-auto flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.12em] text-accent"
                  >
                    <X className="h-3 w-3" strokeWidth={1.75} />
                    Limpar
                  </Link>
                )}
              </div>

              <form action="/explorar" method="get" className="mt-4">
                <input type="hidden" name="tab" value={tab} />
                {state && <input type="hidden" name="state" value={state} />}
                {type && <input type="hidden" name="type" value={type} />}
                {status && <input type="hidden" name="status" value={status} />}
                <label
                  htmlFor="explore-search"
                  className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted/60"
                >
                  Buscar
                </label>
                <div className="mt-1.5 flex items-center gap-2 border-b border-line py-2 focus-within:border-ink">
                  <Search className="h-3.5 w-3.5 text-muted/60" strokeWidth={1.5} />
                  <input
                    id="explore-search"
                    name="q"
                    defaultValue={query}
                    placeholder="Nome, bairro ou cidade"
                    className="w-full bg-transparent text-[12px] text-ink placeholder:text-muted/50 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="shrink-0 font-mono text-[8px] uppercase tracking-[0.14em] text-accent"
                  >
                    Ir
                  </button>
                </div>
              </form>

              <div className="mt-7">
                <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted/60">
                  Região
                </p>
                <ul className="mt-2">
                  <li>
                    <Link
                      href={href({ state: undefined })}
                      className={cn(
                        "flex items-center justify-between border-b border-line/70 py-2 text-[12px] transition-colors",
                        state ? "text-muted hover:text-ink" : "text-ink",
                      )}
                    >
                      Todo o Brasil
                      <span className="font-mono text-[8px] tabular-nums text-muted/50">
                        {tab === "agencies" ? agencies.length : developments.length}
                      </span>
                    </Link>
                  </li>
                  {states.map((stateCode) => (
                    <li key={stateCode}>
                      <Link
                        href={href({ state: stateCode })}
                        className={cn(
                          "flex items-center justify-between border-b border-line/70 py-2 text-[12px] transition-colors",
                          state === stateCode
                            ? "text-ink"
                            : "text-muted hover:text-ink",
                        )}
                      >
                        {stateCode}
                        <span className="font-mono text-[8px] tabular-nums text-muted/50">
                          {stateCounts.get(stateCode) ?? 0}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {tab === "developments" && (
                <>
                  <div className="mt-7">
                    <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted/60">
                      Tipologia
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <FilterChip
                        href={href({ type: undefined })}
                        active={!type}
                        label="Todas"
                      />
                      {TYPE_ORDER.map((typeKey) => (
                        <FilterChip
                          key={typeKey}
                          href={href({ type: typeKey })}
                          active={type === typeKey}
                          label={developmentTypeLabels[typeKey]}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="mt-6">
                    <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted/60">
                      Estágio
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <FilterChip
                        href={href({ status: undefined })}
                        active={!status}
                        label="Todos"
                      />
                      {STATUS_ORDER.map((statusKey) => (
                        <FilterChip
                          key={statusKey}
                          href={href({ status: statusKey })}
                          active={status === statusKey}
                          label={developmentStatusLabels[statusKey]}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="mt-8 border border-line bg-paper-raised p-4">
                <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted/60">
                  Publicação
                </p>
                <p className="mt-2 text-[11.5px] leading-relaxed text-muted">
                  Cada empreendimento ganha um endereço próprio. O botão{" "}
                  <span className="text-ink">3D</span> indica maquete interativa
                  disponível.
                </p>
                <Link
                  href="/criar-conta"
                  className="mt-3 inline-flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.14em] text-accent"
                >
                  Publicar o meu
                  <ArrowUpRight className="h-3 w-3" strokeWidth={1.75} />
                </Link>
              </div>
            </aside>

            {/* Results */}
            <div className="lg:col-span-9">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted/60">
                    {tab === "developments" ? "Empreendimentos" : "Imobiliárias"}
                  </span>
                  {state && <Badge tone="outline">{state}</Badge>}
                  {type && (
                    <Badge tone="outline">
                      {developmentTypeLabels[type as DevelopmentType] ?? type}
                    </Badge>
                  )}
                  {status && (
                    <Badge tone="outline">
                      {developmentStatusLabels[status as DevelopmentStatus] ?? status}
                    </Badge>
                  )}
                  {query && <Badge tone="outline">&ldquo;{query}&rdquo;</Badge>}
                </div>
                <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted/50">
                  {tab === "developments"
                    ? `${filteredDevelopments.length} de ${developments.length}`
                    : `${agencyPool.length} de ${agencies.length}`}
                </span>
              </div>

              {tab === "developments" ? (
                filteredDevelopments.length > 0 ? (
                  <div className="mt-6 grid gap-5 md:grid-cols-2">
                    {filteredDevelopments.map((development, index) => (
                      <DevelopmentCard
                        key={development.id}
                        development={development}
                        agency={agencies.find(
                          (agency) => agency.id === development.agencyId,
                        )}
                        priority={index < 2}
                        className={index === 0 ? "md:col-span-2" : undefined}
                        variant={index === 0 ? "wide" : "default"}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="Nenhum empreendimento com esses filtros."
                    description="Tente outra região ou remova um dos filtros para ver o diretório completo."
                    href={href({
                      state: undefined,
                      type: undefined,
                      status: undefined,
                      q: undefined,
                    })}
                  />
                )
              ) : agencyPool.length > 0 ? (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {agencyPool.map((agency) => (
                    <AgencyCard
                      key={agency.id}
                      agency={agency}
                      developments={developments.filter(
                        (development) => development.agencyId === agency.id,
                      )}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="Nenhuma imobiliária nesta região."
                  description="Ajuste a busca ou veja todas as imobiliárias da plataforma."
                  href={href({ state: undefined, q: undefined })}
                />
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function FilterChip({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "border px-2 py-1 font-mono text-[8px] uppercase tracking-[0.12em] transition-colors",
        active
          ? "border-ink bg-ink text-paper"
          : "border-line text-muted hover:border-ink/40 hover:text-ink",
      )}
    >
      {label}
    </Link>
  );
}

function EmptyState({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <div className="mt-6 flex min-h-72 flex-col items-start justify-center border border-line bg-paper-raised p-8">
      <p className="font-display text-2xl text-ink">{title}</p>
      <p className="mt-2 max-w-sm text-[12.5px] leading-relaxed text-muted">
        {description}
      </p>
      <Link
        href={href}
        className="mt-5 inline-flex items-center gap-1.5 border border-ink px-4 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-ink transition-colors hover:bg-ink hover:text-paper"
      >
        Limpar filtros
        <X className="h-3 w-3" strokeWidth={1.75} />
      </Link>
    </div>
  );
}

function ExploreFallback() {
  return (
    <div className="container-editorial py-16">
      <div className="skeleton h-4 w-40" />
      <div className="skeleton mt-6 h-24 w-3/4" />
      <div className="mt-4 skeleton h-4 w-1/2" />
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="skeleton aspect-[4/3]" />
        ))}
      </div>
    </div>
  );
}

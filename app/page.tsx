import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Box,
  Layers,
  MousePointerClick,
} from "lucide-react";
import {
  agencies,
  developments,
  getCities,
  platformStats,
} from "@/data/seed";
import { BuildingViewerLoader } from "@/components/viewer/viewer-loader";
import { DevelopmentCard } from "@/components/marketing/development-card";
import { AgencyCard } from "@/components/marketing/agency-card";
import { DevelopmentLink } from "@/components/marketing/development-link";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { formatBRL, formatNumber } from "@/lib/format";
import { developmentHost } from "@/lib/utils";

const steps = [
  {
    index: "01",
    title: "Explore por fora",
    description:
      "Gire o edifício, isole andares e entenda a implantação. A maquete responde ao mouse e ao toque, sem instalar nada.",
    icon: Box,
  },
  {
    index: "02",
    title: "Escolha a unidade",
    description:
      "Clique no apartamento e veja metragem, posição solar, planta, valor e condições. Cada unidade é um nó do modelo.",
    icon: MousePointerClick,
  },
  {
    index: "03",
    title: "Decida com contexto",
    description:
      "Fotos do decorado, ficha técnica, localização e um canal direto com a imobiliária. Tudo na mesma página.",
    icon: Layers,
  },
];

export default function HomePage() {
  const heroDevelopment =
    developments.find((development) => development.featured) ?? developments[0];
  const heroUnit =
    heroDevelopment.units.find(
      (unit) =>
        unit.status === "available" && unit.type === "3_bedrooms",
    ) ??
    heroDevelopment.units.find((unit) => unit.status === "available") ??
    heroDevelopment.units[0];
  const heroAgency =
    agencies.find((agency) => agency.id === heroDevelopment.agencyId) ??
    agencies[0];

  const stats = platformStats();
  const cities = getCities();
  const featured = developments.filter(
    (development) => development.id !== heroDevelopment.id,
  );
  const [leadDevelopment, secondDevelopment, thirdDevelopment, fourthDevelopment] =
    featured;

  return (
    <>
      <SiteHeader />

      <main>
        {/* ── Hero ───────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b border-line">
          <div className="container-editorial">
            <div className="grid items-center gap-10 py-10 lg:grid-cols-12 lg:gap-8 lg:py-16">
              <div className="lg:col-span-6">
                <Reveal>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-2 border border-line-strong px-2.5 py-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                      <span className="font-mono text-[8.5px] uppercase tracking-[0.18em] text-ink">
                        Maquete digital
                      </span>
                    </span>
                    <span className="font-mono text-[8.5px] uppercase tracking-[0.18em] text-muted">
                      Brasil · {stats.cities} cidades
                    </span>
                  </div>
                </Reveal>

                <Reveal delay={60}>
                  <h1 className="mt-7 display-xl text-ink">
                    O imóvel
                    <br />
                    inteiro,
                    <br />
                    <span className="serif-italic text-accent">antes</span> da
                    visita.
                  </h1>
                </Reveal>

                <Reveal delay={120}>
                  <p className="mt-7 max-w-md text-pretty text-[14px] leading-relaxed text-ink-soft">
                    Empreendimentos navegáveis em 3D: gire o prédio, escolha o
                    andar, abra a unidade. A imobiliária publica, você decide
                    com o contexto todo à vista.
                  </p>
                </Reveal>

                <Reveal delay={180}>
                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <Link
                      href="/explorar?tab=developments"
                      className={buttonStyles({ size: "lg" })}
                    >
                      Explorar empreendimentos
                      <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
                    </Link>
                    <Link
                      href="/criar-conta"
                      className={buttonStyles({ variant: "outline", size: "lg" })}
                    >
                      Sou imobiliária
                      <ArrowUpRight className="h-4 w-4" strokeWidth={1.75} />
                    </Link>
                  </div>
                </Reveal>

                <Reveal delay={240}>
                  <dl className="mt-10 grid max-w-lg grid-cols-3 border-t border-line pt-5">
                    <div>
                      <dt className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted/70">
                        Empreendimentos
                      </dt>
                      <dd className="mt-1 font-display text-2xl text-ink">
                        {String(stats.developments).padStart(2, "0")}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted/70">
                        Unidades
                      </dt>
                      <dd className="mt-1 font-display text-2xl text-ink">
                        {formatNumber(stats.units)}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted/70">
                        Livres agora
                      </dt>
                      <dd className="mt-1 font-display text-2xl text-ink">
                        {formatNumber(stats.availableUnits)}
                      </dd>
                    </div>
                  </dl>
                </Reveal>
              </div>

              <div className="lg:col-span-6">
                <Reveal delay={120}>
                  <div className="relative border border-stage-line bg-stage">
                    <div className="h-[420px] sm:h-[500px] lg:h-[560px]">
                      <BuildingViewerLoader
                        development={heroDevelopment}
                        minimal
                        className="h-full w-full"
                      />
                    </div>

                    <div className="pointer-events-none absolute left-4 top-4 z-20 border border-paper/12 bg-stage/70 px-3 py-2 backdrop-blur-md">
                      <p className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.18em] text-paper/55">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
                        Ao vivo · 3D
                      </p>
                      <p className="mt-1 font-mono text-[9px] lowercase tracking-[0.08em] text-paper/35">
                        {developmentHost(heroDevelopment.slug)}
                      </p>
                    </div>

                    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 border-t border-paper/10 bg-gradient-to-t from-stage via-stage/85 to-transparent px-4 pb-4 pt-10">
                      <div className="pointer-events-auto flex items-end justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-paper/40">
                            {heroDevelopment.name} · Unidade {heroUnit.code}
                          </p>
                          <p className="mt-1 truncate font-display text-xl leading-tight text-paper">
                            {heroUnit.name}
                          </p>
                          <div className="mt-1.5 flex items-center gap-3">
                            <span className="text-[14px] text-paper">
                              {formatBRL(heroUnit.pricing.basePrice)}
                            </span>
                            <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-paper/35">
                              {heroUnit.area.total} m² · {heroUnit.floor}º andar
                            </span>
                          </div>
                        </div>
                        <DevelopmentLink
                          slug={heroDevelopment.slug}
                          ariaLabel={`Abrir ${heroDevelopment.name} em 3D`}
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-paper/25 text-paper transition-colors hover:border-paper hover:bg-paper hover:text-ink"
                        >
                          <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} />
                        </DevelopmentLink>
                      </div>
                    </div>
                  </div>
                </Reveal>

                <Reveal delay={180}>
                  <div className="mt-3 flex items-center justify-between gap-3 font-mono text-[8px] uppercase tracking-[0.16em] text-muted/70">
                    <span>Arraste para girar · clique na unidade</span>
                    <span className="hidden sm:inline">{heroAgency.name}</span>
                  </div>
                </Reveal>
              </div>
            </div>
          </div>

          {/* City ticker */}
          <div className="border-t border-line bg-paper-deep/50">
            <div className="container-editorial flex items-center gap-6 overflow-x-auto py-3 no-scrollbar">
              <span className="shrink-0 font-mono text-[8px] uppercase tracking-[0.2em] text-muted/60">
                Onde estamos
              </span>
              {cities.map((city) => (
                <Link
                  key={`${city.city}-${city.state}`}
                  href={`/explorar?tab=developments&state=${city.state}`}
                  className="flex shrink-0 items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-soft transition-colors hover:text-accent"
                >
                  {city.city}
                  <span className="text-muted/40">/{city.state}</span>
                  <span className="text-[8px] text-muted/50">{city.count}</span>
                </Link>
              ))}
              <Link
                href="/explorar"
                className="ml-auto hidden shrink-0 items-center gap-1 font-mono text-[8px] uppercase tracking-[0.16em] text-accent sm:flex"
              >
                Ver mapa completo
                <ArrowUpRight className="h-3 w-3" strokeWidth={1.75} />
              </Link>
            </div>
          </div>
        </section>

        {/* ── Featured developments ──────────────────────────────────────── */}
        <section className="border-b border-line">
          <div className="container-editorial py-16 lg:py-24">
            <Reveal>
              <SectionHeading
                index="01"
                eyebrow="Seleção da semana"
                title={
                  <>
                    Empreendimentos para
                    <br />
                    ver <span className="serif-italic">de dentro.</span>
                  </>
                }
                description="Uma curadoria de projetos com maquete 3D completa. Sem tour falso, sem render que esconde o produto."
                actions={
                  <Link
                    href="/explorar?tab=developments"
                    className="group inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-ink"
                  >
                    Ver todos os {stats.developments}
                    <span className="flex h-7 w-7 items-center justify-center rounded-full border border-line-strong transition-colors group-hover:border-ink group-hover:bg-ink group-hover:text-paper">
                      <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </span>
                  </Link>
                }
              />
            </Reveal>

            <div className="mt-10 grid gap-5 lg:grid-cols-12">
              {leadDevelopment && (
                <Reveal className="lg:col-span-8">
                  <DevelopmentCard
                    development={leadDevelopment}
                    agency={agencies.find(
                      (agency) => agency.id === leadDevelopment.agencyId,
                    )}
                    variant="wide"
                  />
                </Reveal>
              )}
              {secondDevelopment && (
                <Reveal delay={60} className="lg:col-span-4">
                  <DevelopmentCard
                    development={secondDevelopment}
                    agency={agencies.find(
                      (agency) => agency.id === secondDevelopment.agencyId,
                    )}
                  />
                </Reveal>
              )}
              {thirdDevelopment && (
                <Reveal delay={80} className="lg:col-span-6">
                  <DevelopmentCard
                    development={thirdDevelopment}
                    agency={agencies.find(
                      (agency) => agency.id === thirdDevelopment.agencyId,
                    )}
                  />
                </Reveal>
              )}
              {fourthDevelopment && (
                <Reveal delay={120} className="lg:col-span-6">
                  <DevelopmentCard
                    development={fourthDevelopment}
                    agency={agencies.find(
                      (agency) => agency.id === fourthDevelopment.agencyId,
                    )}
                  />
                </Reveal>
              )}
            </div>
          </div>
        </section>

        {/* ── How it works ───────────────────────────────────────────────── */}
        <section id="como-funciona" className="border-b border-stage-line bg-ink text-paper">
          <div className="container-editorial py-16 lg:py-24">
            <div className="grid gap-12 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <Reveal>
                  <SectionHeading
                    index="02"
                    eyebrow="Como funciona"
                    tone="paper"
                    title={
                      <>
                        Três gestos
                        <br />
                        entre o anúncio e a{" "}
                        <span className="serif-italic text-accent">decisão.</span>
                      </>
                    }
                    description="A mesma experiência serve ao comprador no celular e ao corretor na mesa. Sem app, sem PDF de 80 páginas."
                  />
                </Reveal>

                <Reveal delay={100}>
                  <div className="mt-10 border border-paper/12 bg-stage/40 p-4 font-mono text-[10px] leading-relaxed text-paper/55">
                    <p className="text-paper/30">{"// unit mapping · units.json"}</p>
                    <p className="mt-2">
                      {"{"}
                      <br />
                      {"  "}
                      <span className="text-paper/35">&quot;unitId&quot;</span>:{" "}
                      <span className="text-accent-soft">
                        &quot;{heroUnit.id}&quot;
                      </span>
                      ,<br />
                      {"  "}
                      <span className="text-paper/35">&quot;meshNames&quot;</span>: [
                      <span className="text-accent-soft">
                        &quot;unit-{heroUnit.code}&quot;
                      </span>
                      ],<br />
                      {"  "}
                      <span className="text-paper/35">&quot;floorLevel&quot;</span>:{" "}
                      <span className="text-accent-soft">{heroUnit.floor}</span>,
                      <br />
                      {"  "}
                      <span className="text-paper/35">&quot;price&quot;</span>:{" "}
                      <span className="text-accent-soft">
                        {heroUnit.pricing.basePrice}
                      </span>
                      <br />
                      {"}"}
                    </p>
                  </div>
                </Reveal>
              </div>

              <div className="lg:col-span-6 lg:col-start-7">
                <ul className="border-t border-paper/15">
                  {steps.map((step, index) => (
                    <Reveal key={step.index} delay={index * 80}>
                      <li className="group grid grid-cols-[auto_1fr] gap-5 border-b border-paper/15 py-7 lg:gap-8">
                        <div className="flex flex-col items-start gap-3">
                          <span className="font-mono text-[10px] tabular-nums tracking-[0.16em] text-accent">
                            {step.index}
                          </span>
                          <step.icon
                            className="h-5 w-5 text-paper/35 transition-colors group-hover:text-paper/70"
                            strokeWidth={1.25}
                          />
                        </div>
                        <div>
                          <h3 className="font-display text-[30px] leading-none text-paper">
                            {step.title}
                          </h3>
                          <p className="mt-3 max-w-md text-[12.5px] leading-relaxed text-paper/50">
                            {step.description}
                          </p>
                        </div>
                      </li>
                    </Reveal>
                  ))}
                </ul>

                <Reveal delay={160}>
                  <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
                    <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-paper/30">
                      GLTF / GLB
                    </span>
                    <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-paper/30">
                      MongoDB GridFS
                    </span>
                    <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-paper/30">
                      JSON unit mapping
                    </span>
                    <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-paper/30">
                      Next.js
                    </span>
                  </div>
                </Reveal>
              </div>
            </div>
          </div>
        </section>

        {/* ── Cities ─────────────────────────────────────────────────────── */}
        <section id="regioes" className="border-b border-line">
          <div className="container-editorial py-16 lg:py-24">
            <div className="grid gap-10 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <Reveal>
                  <SectionHeading
                    index="03"
                    eyebrow="Onde estamos"
                    title={
                      <>
                        Um endereço
                        <br />
                        para cada{" "}
                        <span className="serif-italic text-accent">janela.</span>
                      </>
                    }
                    description="Curadoria local, padrão de plataforma. Escolha uma região para ver os empreendimentos disponíveis."
                  />
                </Reveal>
                <Reveal delay={80}>
                  <Link
                    href="/explorar"
                    className={buttonStyles({
                      variant: "outline",
                      size: "md",
                      className: "mt-6",
                    })}
                  >
                    Abrir diretório completo
                    <ArrowUpRight className="h-4 w-4" strokeWidth={1.75} />
                  </Link>
                </Reveal>
              </div>

              <div className="lg:col-span-7 lg:col-start-6">
                <div className="border-t border-ink">
                  {cities.map((city, index) => (
                    <Reveal key={`${city.city}-${city.state}`} delay={index * 60}>
                      <Link
                        href={`/explorar?tab=developments&state=${city.state}`}
                        className="group flex items-center justify-between gap-6 border-b border-line py-5"
                      >
                        <div className="flex min-w-0 items-baseline gap-4">
                          <span className="font-mono text-[9px] tabular-nums tracking-[0.14em] text-muted/50">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="font-display text-3xl leading-none text-ink transition-colors group-hover:text-accent sm:text-4xl">
                            {city.city}
                          </span>
                          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted/60">
                            {city.state}
                          </span>
                        </div>
                        <div className="flex shrink-0 items-center gap-5">
                          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
                            {city.count}{" "}
                            {city.count === 1 ? "projeto" : "projetos"}
                          </span>
                          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-muted transition-colors group-hover:border-ink group-hover:bg-ink group-hover:text-paper">
                            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                          </span>
                        </div>
                      </Link>
                    </Reveal>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Agencies ───────────────────────────────────────────────────── */}
        <section id="imobiliarias" className="border-b border-line bg-paper-deep/40">
          <div className="container-editorial py-16 lg:py-24">
            <Reveal>
              <SectionHeading
                index="04"
                eyebrow="Imobiliárias"
                title={
                  <>
                    Quem assina
                    <br />
                    cada <span className="serif-italic">endereço.</span>
                  </>
                }
                description="Agências independentes que publicam seus empreendimentos com maquete 3D e atendimento direto."
                actions={
                  <Link
                    href="/explorar?tab=agencies"
                    className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink underline-offset-4 hover:underline"
                  >
                    Todas as imobiliárias
                  </Link>
                }
              />
            </Reveal>

            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {agencies.map((agency, index) => (
                <Reveal key={agency.id} delay={index * 50}>
                  <AgencyCard
                    agency={agency}
                    developments={developments.filter(
                      (development) => development.agencyId === agency.id,
                    )}
                  />
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── For agencies ───────────────────────────────────────────────── */}
        <section className="border-b border-line">
          <div className="container-editorial py-16 lg:py-24">
            <div className="grid items-center gap-10 lg:grid-cols-12">
              <div className="lg:col-span-6">
                <Reveal>
                  <Badge tone="accent">Para imobiliárias</Badge>
                </Reveal>
                <Reveal delay={60}>
                  <h2 className="mt-5 display-lg text-ink">
                    Sua imobiliária
                    <br />
                    merece mais
                    <br />
                    que um <span className="serif-italic text-accent">PDF.</span>
                  </h2>
                </Reveal>
                <Reveal delay={120}>
                  <p className="mt-6 max-w-md text-pretty text-[13.5px] leading-relaxed text-muted">
                    Publique cada empreendimento em um subdomínio próprio, com
                    maquete interativa, unidades, valores e captura de leads. A
                    operação inteira em um painel editorial.
                  </p>
                </Reveal>
                <Reveal delay={180}>
                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <Link
                      href="/criar-conta"
                      className={buttonStyles({ size: "lg" })}
                    >
                      Criar conta da imobiliária
                      <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
                    </Link>
                    <Link
                      href="/entrar"
                      className={buttonStyles({ variant: "ghost", size: "lg" })}
                    >
                      Já tenho acesso
                    </Link>
                  </div>
                </Reveal>
              </div>

              <div className="lg:col-span-5 lg:col-start-8">
                <Reveal delay={100}>
                  <div className="border border-line bg-paper-raised">
                    <div className="flex items-center justify-between border-b border-line px-4 py-3">
                      <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-muted">
                        Painel · Empreendimentos
                      </span>
                      <span className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.14em] text-forest">
                        <span className="h-1.5 w-1.5 rounded-full bg-forest" />
                        Publicado
                      </span>
                    </div>
                    <ul>
                      {developments.slice(0, 3).map((development) => {
                        const free = development.units.filter(
                          (unit) => unit.status === "available",
                        ).length;
                        return (
                          <li
                            key={development.id}
                            className="flex items-center justify-between gap-4 border-b border-line/70 px-4 py-3.5"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-[12.5px] text-ink">
                                {development.name}
                              </p>
                              <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-muted/60">
                                {development.address.city} ·{" "}
                                {development.units.length} unidades
                              </p>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="font-display text-base text-ink">
                                {free}
                              </p>
                              <p className="font-mono text-[7.5px] uppercase tracking-[0.12em] text-muted/50">
                                livres
                              </p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted/60">
                        Modelo GLB · 1,8 MB
                      </span>
                      <Link
                        href="/painel/empreendimentos"
                        className="inline-flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.14em] text-accent"
                      >
                        Abrir painel
                        <ArrowUpRight className="h-3 w-3" strokeWidth={1.75} />
                      </Link>
                    </div>
                  </div>
                </Reveal>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

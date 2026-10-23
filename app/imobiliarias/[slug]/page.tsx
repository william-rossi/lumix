import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowUpRight,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Globe,
} from "lucide-react";
import { agencies } from "@/data/seed";
import { getAgencyBySlug, listDevelopments } from "@/lib/db/repository";
import { connection } from "next/server";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { DevelopmentCard } from "@/components/marketing/development-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { formatCompactBRL, formatNumber } from "@/lib/format";
import { initials } from "@/lib/utils";

export function generateStaticParams() {
  return agencies.map((agency) => ({ slug: agency.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  await connection();
  const agency = await getAgencyBySlug(slug);
  if (!agency) notFound();

  return {
    title: `${agency.name} — ${agency.address.city} / ${agency.address.state}`,
    description: agency.description,
    openGraph: {
      title: agency.name,
      description: agency.description,
      images: agency.coverImage ? [agency.coverImage] : undefined,
    },
  };
}

export const instant = false;

export default async function AgencyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await connection();
  const agency = await getAgencyBySlug(slug);
  if (!agency) notFound();

  const agencyDevelopments = await listDevelopments({ agencyId: agency.id });
  const units = agencyDevelopments.flatMap((development) => development.units);
  const available = units.filter((unit) => unit.status === "available");
  const minPrice =
    available.length > 0
      ? Math.min(...available.map((unit) => unit.pricing.basePrice))
      : 0;
  const cities = Array.from(
    new Set(
      agencyDevelopments.map(
        (development) =>
          `${development.address.city} / ${development.address.state}`,
      ),
    ),
  );
  const since = new Date(agency.createdAt).getFullYear();
  const whatsup = agency.phone.replace(/\D/g, "");

  return (
    <>
      <SiteHeader />

      <main>
        <section className="border-b border-line">
          <div className="container-editorial py-10 lg:py-16">
            <div className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.16em] text-muted">
              <Link href="/explorar?tab=agencies" className="hover:text-ink">
                Imobiliárias
              </Link>
              <span className="text-line-strong">/</span>
              <span className="text-ink">{agency.name}</span>
            </div>

            <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:gap-12">
              <div className="lg:col-span-7">
                <div className="flex items-center gap-4">
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center border border-ink font-display text-2xl text-ink">
                    {initials(agency.name)}
                  </span>
                  <div>
                    <Badge tone="accent">Imobiliária verificada</Badge>
                    <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
                      {agency.creci} · desde {since}
                    </p>
                  </div>
                </div>

                <h1 className="mt-7 display-lg text-ink">{agency.name}</h1>

                <p className="mt-4 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
                  <MapPin className="h-3.5 w-3.5 text-accent" strokeWidth={1.5} />
                  {agency.address.neighborhood} · {agency.address.city} /{" "}
                  {agency.address.state}
                </p>

                <p className="mt-6 max-w-xl text-pretty text-[14px] leading-relaxed text-ink-soft">
                  {agency.description}
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <a
                    href={`https://wa.me/55${whatsup}`}
                    target="_blank"
                    rel="noreferrer"
                    className={buttonStyles({ size: "md" })}
                  >
                    Falar com a equipe
                    <ArrowUpRight className="h-4 w-4" strokeWidth={1.75} />
                  </a>
                  <Link
                    href={`/explorar?tab=developments&state=${agency.address.state}`}
                    className={buttonStyles({ variant: "outline", size: "md" })}
                  >
                    Ver empreendimentos em {agency.address.state}
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="relative aspect-[4/3] overflow-hidden border border-line bg-paper-deep">
                  <Image
                    src={agency.coverImage ?? `/examples/ap-1.jpg`}
                    alt={`${agency.name} — ${agency.address.city}`}
                    fill
                    priority
                    sizes="(min-width: 1024px) 42vw, 100vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stage/70 via-transparent to-transparent" />
                  <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3">
                    <p className="font-mono text-[8.5px] uppercase tracking-[0.16em] text-paper/70">
                      {agencyDevelopments.length} empreendimentos ·{" "}
                      {formatNumber(units.length)} unidades
                    </p>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-paper/30 text-paper">
                      <ShieldCheck className="h-4 w-4" strokeWidth={1.5} />
                    </span>
                  </div>
                </div>

                <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-4">
                  <div>
                    <dt className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted/60">
                      Projetos
                    </dt>
                    <dd className="mt-1 font-display text-xl text-ink">
                      {String(agencyDevelopments.length).padStart(2, "0")}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted/60">
                      Livres
                    </dt>
                    <dd className="mt-1 font-display text-xl text-ink">
                      {formatNumber(available.length)}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted/60">
                      A partir
                    </dt>
                    <dd className="mt-1 font-display text-xl text-ink">
                      {minPrice ? formatCompactBRL(minPrice) : "—"}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-line">
          <div className="container-editorial py-14 lg:py-20">
            <Reveal>
              <SectionHeading
                index="01"
                eyebrow="Portfólio"
                title={
                  <>
                    Empreendimentos
                    <br />
                    <span className="serif-italic">assinados.</span>
                  </>
                }
                description={`Projetos publicados pela ${agency.name}, com maquete 3D, unidades e condições atualizadas.`}
                actions={
                  <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
                    {agencyDevelopments.length} publicados
                  </span>
                }
              />
            </Reveal>

            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {agencyDevelopments.map((development, index) => (
                <Reveal key={development.id} delay={index * 60}>
                  <DevelopmentCard
                    development={development}
                    agency={agency}
                    variant={index === 0 ? "wide" : "default"}
                    className={index === 0 ? "md:col-span-2" : undefined}
                  />
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-line bg-paper-deep/40">
          <div className="container-editorial py-14 lg:py-20">
            <div className="grid gap-10 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <Reveal>
                  <SectionHeading
                    index="02"
                    eyebrow="Atendimento"
                    title={
                      <>
                        Direto com
                        <br />
                        quem <span className="serif-italic text-accent">conhece</span>
                        <br />o bairro.
                      </>
                    }
                    description="Sem central de call center. A conversa começa na imobiliária que assina o empreendimento."
                  />
                </Reveal>

                <Reveal delay={80}>
                  <div className="mt-8 border-t border-line pt-4">
                    <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted/60">
                      Cobertura
                    </p>
                    <ul className="mt-3 flex flex-wrap gap-1.5">
                      {cities.map((city) => (
                        <li
                          key={city}
                          className="border border-line px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.12em] text-ink-soft"
                        >
                          {city}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              </div>

              <div className="lg:col-span-5 lg:col-start-8">
                <Reveal delay={100}>
                  <div className="border border-line bg-paper-raised">
                    <div className="border-b border-line px-5 py-4">
                      <p className="eyebrow text-accent">Contato direto</p>
                      <p className="mt-2 font-display text-2xl text-ink">
                        {agency.name}
                      </p>
                      <p className="mt-1 font-mono text-[8.5px] uppercase tracking-[0.14em] text-muted">
                        {agency.creci}
                      </p>
                    </div>

                    <ul className="divide-y divide-line px-5 text-[12.5px] text-ink-soft">
                      <li>
                        <a
                          href={`tel:${agency.phone.replace(/\s/g, "")}`}
                          className="flex items-center gap-3 py-3.5 transition-colors hover:text-accent"
                        >
                          <Phone className="h-4 w-4 text-muted" strokeWidth={1.5} />
                          {agency.phone}
                        </a>
                      </li>
                      <li>
                        <a
                          href={`mailto:${agency.email}`}
                          className="flex items-center gap-3 py-3.5 transition-colors hover:text-accent"
                        >
                          <Mail className="h-4 w-4 text-muted" strokeWidth={1.5} />
                          {agency.email}
                        </a>
                      </li>
                      {agency.website && (
                        <li>
                          <a
                            href={agency.website}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-3 py-3.5 transition-colors hover:text-accent"
                          >
                            <Globe className="h-4 w-4 text-muted" strokeWidth={1.5} />
                            {agency.website.replace(/^https?:\/\//, "")}
                          </a>
                        </li>
                      )}
                      <li className="flex items-start gap-3 py-3.5">
                        <MapPin
                          className="mt-0.5 h-4 w-4 shrink-0 text-muted"
                          strokeWidth={1.5}
                        />
                        <span>
                          {agency.address.street}, {agency.address.number}
                          {agency.address.complement
                            ? ` · ${agency.address.complement}`
                            : ""}
                          <br />
                          {agency.address.neighborhood} · {agency.address.city} /{" "}
                          {agency.address.state}
                          <br />
                          {agency.address.zipCode}
                        </span>
                      </li>
                    </ul>

                    <div className="border-t border-line p-5">
                      <a
                        href={`mailto:${agency.email}?subject=${encodeURIComponent(
                          `Contato pelo site da ${agency.name}`,
                        )}`}
                        className={buttonStyles({
                          variant: "accent",
                          size: "md",
                          className: "w-full",
                        })}
                      >
                        Enviar mensagem
                        <ArrowUpRight className="h-4 w-4" strokeWidth={1.75} />
                      </a>
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

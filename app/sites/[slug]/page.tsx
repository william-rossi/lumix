import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ArrowUpRight, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { developments as seedDevelopments } from "@/data/seed";
import {
  getAgencyById,
  getDevelopmentBySlug,
} from "@/lib/db/repository";
import { DevelopmentHeader } from "@/components/development/development-header";
import { DevelopmentExplorer } from "@/components/development/development-explorer";
import { DevelopmentGallery } from "@/components/development/development-gallery";
import { LocationPanel } from "@/components/development/location-panel";
import { LeadForm } from "@/components/development/lead-form";
import { DevelopmentFooter } from "@/components/development/development-footer";
import { SectionHeading } from "@/components/ui/section-heading";
import { AmenityIcon } from "@/components/ui/amenity-icon";
import { Reveal } from "@/components/ui/reveal";
import { buttonStyles } from "@/components/ui/button";
import {
  developmentStatusLabels,
  formatArea,
  formatBRL,
  formatMonthYear,
  unitTypeLabels,
} from "@/lib/format";
import { developmentHost, initials } from "@/lib/utils";

const amenityCategories: Record<string, string> = {
  leisure: "Lazer",
  wellness: "Bem-estar",
  sports: "Esporte",
  convenience: "Conveniência",
  security: "Segurança",
  sustainability: "Sustentabilidade",
  technology: "Tecnologia",
};

export function generateStaticParams() {
  return seedDevelopments.map((development) => ({
    slug: development.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  await connection();
  const development = await getDevelopmentBySlug(slug);
  if (!development) notFound();

  const host = developmentHost(development.slug);
  const title = `${development.name} — ${development.address.neighborhood}, ${development.address.city}`;

  return {
    title,
    description:
      development.tagline ??
      `Conheça ${development.name} em 3D: unidades, plantas e condições.`,
    alternates: {
      canonical: `https://${host}`,
    },
    openGraph: {
      title,
      description: development.tagline,
      type: "website",
      url: `https://${host}`,
      images: [
        {
          url: development.coverImage,
          alt: development.name,
        },
      ],
    },
  };
}

export const instant = false;

export default async function DevelopmentSitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await connection();
  const development = await getDevelopmentBySlug(slug);
  if (!development) notFound();

  const resolvedAgency = await getAgencyById(development.agencyId);
  if (!resolvedAgency) notFound();

  const available = development.units.filter(
    (unit) => unit.status === "available",
  );
  const areas = development.units.map((unit) => unit.area.total);
  const typologies = Array.from(
    new Set(development.units.map((unit) => unit.type)),
  );

  const whatsapp = resolvedAgency.phone.replace(/\D/g, "");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ApartmentComplex",
    name: development.name,
    description: development.description,
    url: `https://${developmentHost(development.slug)}`,
    image: development.gallery.map((image) => image.url),
    address: {
      "@type": "PostalAddress",
      streetAddress: `${development.address.street}, ${development.address.number}`,
      addressLocality: development.address.city,
      addressRegion: development.address.state,
      postalCode: development.address.zipCode,
      addressCountry: "BR",
    },
    ...(development.address.coordinates
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: development.address.coordinates.lat,
            longitude: development.address.coordinates.lng,
          },
        }
      : {}),
    numberOfAccommodationUnits: development.units.length,
    amenityFeature: development.amenities.map((amenity) => ({
      "@type": "LocationFeatureSpecification",
      name: amenity.name,
    })),
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "BRL",
      lowPrice: development.pricing.minPrice / 100,
      highPrice: development.pricing.maxPrice / 100,
      offerCount: available.length,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <DevelopmentHeader development={development} agency={resolvedAgency} />

      <main>
        <DevelopmentExplorer development={development} agency={resolvedAgency} />

        {/* 01 — Story */}
        <section id="sobre" className="border-b border-line">
          <div className="container-editorial py-16 lg:py-24">
            <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
              <div className="lg:col-span-4">
                <Reveal>
                  <SectionHeading
                    index="01"
                    eyebrow="O empreendimento"
                    title={
                      <>
                        Um endereço
                        <br />
                        <span className="serif-italic text-accent">
                          feito para durar.
                        </span>
                      </>
                    }
                  />
                </Reveal>
                <Reveal delay={80}>
                  <p className="mt-6 max-w-sm text-pretty text-[13px] leading-relaxed text-muted">
                    {development.description}
                  </p>
                </Reveal>
                <Reveal delay={140}>
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <Link
                      href="#contato"
                      className={buttonStyles({ variant: "primary", size: "md" })}
                    >
                      Agendar uma visita
                      <ArrowUpRight className="h-4 w-4" strokeWidth={1.75} />
                    </Link>
                    <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
                      {available.length} unidades disponíveis
                    </span>
                  </div>
                </Reveal>
              </div>

              <div className="lg:col-span-7 lg:col-start-6">
                <Reveal>
                  <div className="relative aspect-[16/10] overflow-hidden border border-line bg-paper-deep">
                    <Image
                      src={(development.gallery[1] ?? development.gallery[0])?.url ?? development.coverImage}
                      alt={(development.gallery[1] ?? development.gallery[0])?.alt ?? development.name}
                      fill
                      sizes="(min-width: 1024px) 58vw, 100vw"
                      className="object-cover"
                    />
                    <span className="absolute left-4 top-4 border border-paper/20 bg-stage/50 px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.16em] text-paper/80 backdrop-blur-sm">
                      {development.address.neighborhood}
                      {development.deliveryDate
                        ? ` · ${formatMonthYear(development.deliveryDate)}`
                        : ""}
                    </span>
                  </div>
                </Reveal>

                <Reveal delay={80}>
                  <blockquote className="mt-8 border-l-2 border-accent pl-5 font-display text-2xl italic leading-[1.15] text-ink lg:text-[30px]">
                    “{development.tagline}”
                  </blockquote>
                </Reveal>

                <Reveal delay={120}>
                  <ul className="mt-8 grid gap-x-8 sm:grid-cols-2">
                    {development.highlights.map((highlight, index) => (
                      <li
                        key={highlight}
                        className="flex items-start gap-3 border-t border-line py-3 text-[12.5px] leading-relaxed text-ink-soft"
                      >
                        <span className="mt-0.5 font-mono text-[9px] tracking-[0.1em] text-accent">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </Reveal>

                <Reveal delay={160}>
                  <dl className="mt-8 grid grid-cols-2 gap-4 border-t border-line pt-6 sm:grid-cols-4">
                    <Fact
                      label="Lançamento"
                      value={
                        development.launchDate
                          ? formatMonthYear(development.launchDate)
                          : "—"
                      }
                    />
                    <Fact
                      label="Entrega"
                      value={
                        development.deliveryDate
                          ? formatMonthYear(development.deliveryDate)
                          : "—"
                      }
                    />
                    <Fact
                      label="Torre"
                      value={`${development.model3d.massing.floors} andares`}
                    />
                    <Fact label="Unidades" value={`${development.units.length}`} />
                  </dl>
                </Reveal>
              </div>
            </div>
          </div>
        </section>

        {/* 02 — Gallery */}
        <section id="galeria" className="border-b border-line">
          <div className="container-editorial py-16 lg:py-24">
            <Reveal>
              <SectionHeading
                index="02"
                eyebrow="Galeria"
                title={
                  <>
                    Antes de visitar,
                    <br />
                    <span className="serif-italic">veja de perto.</span>
                  </>
                }
                description="Materiais, luz e proporção. As imagens são do decorado e dos espaços de lazer do empreendimento."
                actions={
                  <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
                    {development.gallery.length} imagens · clique para ampliar
                  </span>
                }
              />
            </Reveal>
            <Reveal delay={80} className="mt-8">
              <DevelopmentGallery images={development.gallery} />
            </Reveal>
          </div>
        </section>

        {/* 03 — Amenities */}
        <section id="lazer" className="bg-ink text-paper">
          <div className="container-editorial py-16 lg:py-24">
            <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
              <div className="lg:col-span-4">
                <Reveal>
                  <SectionHeading
                    index="03"
                    eyebrow="Áreas comuns"
                    tone="paper"
                    title={
                      <>
                        O prédio é uma
                        <br />
                        <span className="serif-italic text-accent">
                          extensão da casa.
                        </span>
                      </>
                    }
                    description="Programa completo, dimensionado para o número de unidades. Nada de lazer subutilizado."
                  />
                </Reveal>
                <Reveal delay={80}>
                  <dl className="mt-8 grid grid-cols-3 gap-4 border-t border-paper/15 pt-5">
                    <div>
                      <dt className="font-mono text-[8px] uppercase tracking-[0.14em] text-paper/35">
                        Itens
                      </dt>
                      <dd className="mt-1 font-display text-2xl text-paper">
                        {development.amenities.length}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[8px] uppercase tracking-[0.14em] text-paper/35">
                        Tipologias
                      </dt>
                      <dd className="mt-1 font-display text-2xl text-paper">
                        {typologies.length}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[8px] uppercase tracking-[0.14em] text-paper/35">
                        Área
                      </dt>
                      <dd className="mt-1 font-display text-2xl text-paper">
                        {Math.round(Math.min(...areas))}–
                        {Math.round(Math.max(...areas))}
                        <span className="ml-1 font-sans text-[9px] uppercase text-paper/40">
                          m²
                        </span>
                      </dd>
                    </div>
                  </dl>
                </Reveal>
              </div>

              <div className="lg:col-span-7 lg:col-start-6">
                <div className="grid border-t border-paper/15 sm:grid-cols-2">
                  {development.amenities.map((amenity, index) => (
                    <Reveal key={amenity.id} delay={index * 25}>
                      <div className="flex h-full items-start gap-3 border-b border-paper/15 py-4 sm:pr-6">
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center border border-paper/15 text-paper/70">
                          <AmenityIcon name={amenity.icon} className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-[12.5px] leading-snug text-paper/85">
                            {amenity.name}
                          </p>
                          <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-paper/30">
                            {amenityCategories[amenity.category] ?? "Lazer"}
                          </p>
                        </div>
                      </div>
                    </Reveal>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 04 — Specifications */}
        <section id="acabamentos" className="border-b border-line">
          <div className="container-editorial py-16 lg:py-24">
            <Reveal>
              <SectionHeading
                index="04"
                eyebrow="Ficha técnica"
                title={
                  <>
                    O que está incluído,
                    <br />
                    <span className="serif-italic">sem letras miúdas.</span>
                  </>
                }
                description="Especificações do memorial descritivo. Acabamentos podem variar conforme a unidade — consulte a versão oficial."
              />
            </Reveal>

            <div className="mt-10 grid gap-10 md:grid-cols-3 md:gap-8">
              {development.specifications.map((specification, index) => (
                <Reveal key={specification.category} delay={index * 60}>
                  <div className="border-t border-ink pt-4">
                    <div className="flex items-baseline justify-between">
                      <h3 className="font-display text-xl text-ink">
                        {specification.category}
                      </h3>
                      <span className="font-mono text-[9px] tabular-nums text-muted/60">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <dl className="mt-4 space-y-3">
                      {specification.items.map((item) => (
                        <div key={item.name} className="border-t border-line pt-2.5">
                          <dt className="font-mono text-[8.5px] uppercase tracking-[0.12em] text-muted/70">
                            {item.name}
                          </dt>
                          <dd
                            className={
                              item.highlight
                                ? "mt-0.5 text-[12.5px] leading-relaxed text-ink"
                                : "mt-0.5 text-[12.5px] leading-relaxed text-muted"
                            }
                          >
                            {item.highlight && (
                              <span className="mr-1.5 inline-block h-1 w-1 rounded-full bg-accent align-middle" />
                            )}
                            {item.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={100}>
              <div className="mt-10 flex flex-col justify-between gap-3 border-t border-line pt-5 sm:flex-row sm:items-center">
                <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
                  Tipologias disponíveis:{" "}
                  {typologies.map((type) => unitTypeLabels[type]).join(" · ")}
                </p>
                <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
                  {formatArea(Math.min(...areas))} a {formatArea(Math.max(...areas))}
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* 05 — Location */}
        <section id="localizacao" className="border-b border-line">
          <div className="container-editorial py-16 lg:py-24">
            <Reveal>
              <SectionHeading
                index="05"
                eyebrow="Localização"
                title={
                  <>
                    O bairro entra
                    <br />
                    <span className="serif-italic">pela janela.</span>
                  </>
                }
                actions={
                  <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
                    {development.address.city} / {development.address.state}
                  </p>
                }
              />
            </Reveal>
            <Reveal delay={80} className="mt-8">
              <LocationPanel
                address={development.address}
                nearby={development.nearby ?? []}
              />
            </Reveal>
          </div>
        </section>

        {/* 06 — Contact */}
        <section id="contato" className="border-b border-line bg-paper-deep">
          <div className="container-editorial py-16 lg:py-24">
            <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
              <div className="lg:col-span-5">
                <Reveal>
                  <SectionHeading
                    index="06"
                    eyebrow="Contato"
                    title={
                      <>
                        Vamos falar
                        <br />
                        <span className="serif-italic text-accent">
                          sobre a sua casa.
                        </span>
                      </>
                    }
                    description={
                      <>
                        Atendimento direto com a equipe da {resolvedAgency.name}.
                        Sem robôs, sem fila.
                      </>
                    }
                  />
                </Reveal>

                <Reveal delay={80}>
                  <div className="mt-8 border border-line bg-paper-raised p-5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center border border-line font-display text-sm text-ink">
                        {initials(resolvedAgency.name)}
                      </span>
                      <div>
                        <p className="text-[13px] text-ink">{resolvedAgency.name}</p>
                        <p className="font-mono text-[8.5px] uppercase tracking-[0.12em] text-muted">
                          {resolvedAgency.creci}
                        </p>
                      </div>
                      <Link
                        href={`/imobiliarias/${resolvedAgency.slug}`}
                        className="ml-auto font-mono text-[8.5px] uppercase tracking-[0.12em] text-muted underline-offset-4 hover:text-ink hover:underline"
                      >
                        Perfil
                      </Link>
                    </div>

                    <ul className="mt-4 space-y-2.5 border-t border-line pt-4 text-[12px] text-ink-soft">
                      <li>
                        <a
                          href={`tel:${resolvedAgency.phone.replace(/\s/g, "")}`}
                          className="flex items-center gap-2.5 hover:text-accent"
                        >
                          <Phone className="h-3.5 w-3.5 text-muted" strokeWidth={1.5} />
                          {resolvedAgency.phone}
                        </a>
                      </li>
                      <li>
                        <a
                          href={`mailto:${resolvedAgency.email}`}
                          className="flex items-center gap-2.5 hover:text-accent"
                        >
                          <Mail className="h-3.5 w-3.5 text-muted" strokeWidth={1.5} />
                          {resolvedAgency.email}
                        </a>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <MapPin
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted"
                          strokeWidth={1.5}
                        />
                        <span>
                          {resolvedAgency.address.street},{" "}
                          {resolvedAgency.address.number} ·{" "}
                          {resolvedAgency.address.neighborhood}
                          <br />
                          {resolvedAgency.address.city} / {resolvedAgency.address.state}
                        </span>
                      </li>
                    </ul>

                    <a
                      href={`https://wa.me/55${whatsapp}?text=${encodeURIComponent(
                        `Olá! Tenho interesse no ${development.name}.`,
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className={buttonStyles({
                        variant: "outline",
                        size: "md",
                        className: "mt-4 w-full",
                      })}
                    >
                      <MessageCircle className="h-4 w-4" strokeWidth={1.5} />
                      Chamar no WhatsApp
                    </a>
                  </div>
                </Reveal>

                <Reveal delay={120}>
                  <div className="mt-5 flex items-end justify-between border-t border-line pt-4">
                    <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
                      {developmentStatusLabels[development.status]}
                    </span>
                    <span className="text-right">
                      <span className="block font-mono text-[8px] uppercase tracking-[0.14em] text-muted/70">
                        A partir de
                      </span>
                      <span className="font-display text-2xl text-ink">
                        {formatBRL(development.pricing.minPrice)}
                      </span>
                    </span>
                  </div>
                </Reveal>
              </div>

              <div className="lg:col-span-7">
                <Reveal delay={60}>
                  <LeadForm development={development} />
                </Reveal>
              </div>
            </div>
          </div>
        </section>
      </main>

      <DevelopmentFooter development={development} agency={resolvedAgency} />
    </>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted/70">
        {label}
      </dt>
      <dd className="mt-1 text-[12.5px] text-ink">{value}</dd>
    </div>
  );
}

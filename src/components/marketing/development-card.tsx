import Image from "next/image";
import { ArrowUpRight, Box } from "lucide-react";
import type { Agency, Development } from "@/models";
import { Badge } from "@/components/ui/badge";
import { DevelopmentLink } from "@/components/marketing/development-link";
import {
  developmentStatusLabels,
  formatArea,
  formatCompactBRL,
  formatDate,
} from "@/lib/format";
import { cn, developmentHost } from "@/lib/utils";

export function DevelopmentCard({
  development,
  agency,
  priority = false,
  variant = "default",
  className,
}: {
  development: Development;
  agency?: Agency;
  priority?: boolean;
  variant?: "default" | "wide";
  className?: string;
}) {
  const available = development.units.filter(
    (unit) => unit.status === "available",
  );
  const smallest = available.reduce(
    (min, unit) => Math.min(min, unit.area.total),
    Number.POSITIVE_INFINITY,
  );
  const isWide = variant === "wide";

  return (
    <DevelopmentLink
      slug={development.slug}
      className={cn("group block", className)}
      ariaLabel={`Ver ${development.name}`}
    >
      <article
        className={cn(
          "border border-line bg-paper-raised transition-colors duration-300 group-hover:border-ink",
          isWide ? "grid md:grid-cols-12" : "",
        )}
      >
        <div
          className={cn(
            "relative overflow-hidden bg-paper-deep",
            isWide ? "md:col-span-7 aspect-[16/10] md:aspect-auto md:min-h-[340px]" : "aspect-[4/3]",
          )}
        >
          <Image
            src={development.coverImage}
            alt={`${development.name} — ${development.address.neighborhood}`}
            fill
            priority={priority}
            sizes={isWide ? "(min-width: 768px) 58vw, 100vw" : "(min-width: 1024px) 33vw, 100vw"}
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stage/70 via-stage/0 to-stage/25" />

          <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
            <Badge tone="paper">{developmentStatusLabels[development.status]}</Badge>
            <Badge tone="dark" className="bg-stage/50 backdrop-blur-sm">
              <Box className="h-3 w-3" strokeWidth={1.6} />
              3D
            </Badge>
          </div>

          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-paper/60">
                {development.address.city} · {development.address.state}
              </p>
              <p className="mt-1 font-display text-xl leading-tight text-paper md:text-2xl">
                {development.address.neighborhood}
              </p>
            </div>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-paper/30 text-paper transition-colors group-hover:border-paper group-hover:bg-paper group-hover:text-ink">
              <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} />
            </span>
          </div>
        </div>

        <div className={cn("flex flex-col p-5 lg:p-6", isWide && "md:col-span-5 md:justify-center md:p-8")}>
          <p className="eyebrow text-muted">{agency?.name ?? "Imobiliária"}</p>
          <h3 className={cn("mt-3 text-balance text-ink", isWide ? "display-md" : "font-display text-2xl leading-[1.05]")}>
            {development.name}
          </h3>

          <p className="mt-3 line-clamp-2 text-[12.5px] leading-relaxed text-muted">
            {development.tagline ?? development.description}
          </p>

          <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-line pt-4 text-[11px]">
            <div>
              <dt className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted/70">
                A partir de
              </dt>
              <dd className="mt-1 font-display text-lg text-ink">
                {formatCompactBRL(development.pricing.minPrice)}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted/70">
                A partir de
              </dt>
              <dd className="mt-1 font-display text-lg text-ink">
                {Number.isFinite(smallest) ? formatArea(smallest) : "—"}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted/70">
                Unidades
              </dt>
              <dd className="mt-1 font-display text-lg text-ink">
                {available.length}
                <span className="ml-1 text-[10px] text-muted">livres</span>
              </dd>
            </div>
          </dl>

          <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
              {developmentHost(development.slug)}
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
              {development.deliveryDate
                ? `Entrega ${formatDate(development.deliveryDate, {
                    month: "short",
                    year: "numeric",
                  })}`
                : "Entrega a definir"}
            </span>
          </div>
        </div>
      </article>
    </DevelopmentLink>
  );
}

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Agency, Development } from "@/models";
import { formatCompactBRL } from "@/lib/format";
import { initials } from "@/lib/utils";

export function AgencyCard({
  agency,
  developments,
}: {
  agency: Agency;
  developments: Development[];
}) {
  const units = developments.flatMap((development) => development.units);
  const available = units.filter((unit) => unit.status === "available");
  const minPrice = available.length
    ? Math.min(...available.map((unit) => unit.pricing.basePrice))
    : 0;

  return (
    <Link
      href={`/imobiliarias/${agency.slug}`}
      className="group flex flex-col justify-between border border-line bg-paper-raised p-6 transition-colors hover:border-ink"
    >
      <div>
        <div className="flex items-start justify-between gap-4">
          <span className="flex h-12 w-12 items-center justify-center border border-line font-display text-lg text-ink">
            {initials(agency.name)}
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-muted transition-colors group-hover:border-ink group-hover:text-ink">
            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.5} />
          </span>
        </div>
        <h3 className="mt-5 font-display text-2xl leading-tight text-ink">
          {agency.name}
        </h3>
        <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
          {agency.address.neighborhood} · {agency.address.city} / {agency.address.state}
        </p>
        <p className="mt-4 line-clamp-2 text-[12.5px] leading-relaxed text-muted">
          {agency.description}
        </p>
      </div>

      <dl className="mt-6 grid grid-cols-3 gap-2 border-t border-line pt-4 text-[11px]">
        <div>
          <dt className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-muted/70">
            Empreend.
          </dt>
          <dd className="mt-1 font-display text-lg text-ink">{developments.length}</dd>
        </div>
        <div>
          <dt className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-muted/70">
            Unidades
          </dt>
          <dd className="mt-1 font-display text-lg text-ink">{available.length}</dd>
        </div>
        <div>
          <dt className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-muted/70">
            A partir
          </dt>
          <dd className="mt-1 font-display text-lg text-ink">
            {minPrice ? formatCompactBRL(minPrice) : "—"}
          </dd>
        </div>
      </dl>

      <p className="mt-3 border-t border-line pt-3 font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
        {agency.creci}
      </p>
    </Link>
  );
}

import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import {
  ArrowUpRight,
  Building2,
  Circle,
  KeyRound,
  Users,
  Wallet,
} from "lucide-react";
import { agencies } from "@/data/seed";
import { listDevelopments, listLeads } from "@/lib/db/repository";
import { Badge } from "@/components/ui/badge";
import { UnitMix } from "@/components/dashboard/unit-mix";
import {
  developmentStatusLabels,
  formatBRL,
  formatCompactBRL,
  formatDate,
  formatNumber,
  leadStatusLabels,
  leadStatusTone,
} from "@/lib/format";
import { cn } from "@/lib/utils";

export const instant = false;

const statusTone = {
  launching: "accent",
  under_construction: "amber",
  ready: "available",
  sold_out: "sold",
} as const;

export default async function PanelOverviewPage() {
  await connection();
  const agency = agencies[0];
  const agencyDevelopments = await listDevelopments({
    agencyId: agency.id,
    includeDrafts: true,
  });
  const developmentIds = new Set(
    agencyDevelopments.map((development) => development.id),
  );
  const agencyLeads = (await listLeads()).filter((lead) =>
    developmentIds.has(lead.developmentId),
  );
  const units = agencyDevelopments.flatMap((development) => development.units);
  const available = units.filter((unit) => unit.status === "available");
  const newLeads = agencyLeads.filter((lead) => lead.status === "new");
  const vgv = available.reduce(
    (total, unit) => total + unit.pricing.basePrice,
    0,
  );
  const recentLeads = [...agencyLeads]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5);

  return (
    <div className="mx-auto max-w-[1360px]">
      <div className="flex flex-col justify-between gap-5 border-b border-line pb-6 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="eyebrow text-muted">Visão geral</span>
            <span className="h-px w-7 bg-line-strong" />
            <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted/60">
              Conta demonstrativa
            </span>
          </div>
          <h1 className="mt-3 font-display text-[clamp(2rem,4vw,3rem)] leading-none text-ink">
            Bom dia, Marina.
          </h1>
          <p className="mt-2 max-w-lg text-[12.5px] leading-relaxed text-muted">
            {available.length} unidades disponíveis, {newLeads.length}{" "}
            {newLeads.length === 1 ? "lead novo" : "leads novos"} e{" "}
            {agencyDevelopments.length} empreendimentos no ar.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Link
            href="/painel/leads"
            className="inline-flex h-9 items-center gap-2 border border-line px-3.5 font-mono text-[8.5px] uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink"
          >
            <Users className="h-3.5 w-3.5" strokeWidth={1.5} />
            Ver leads
          </Link>
          <Link
            href="/painel/empreendimentos/novo"
            className="inline-flex h-9 items-center gap-2 bg-ink px-3.5 font-mono text-[8.5px] uppercase tracking-[0.14em] text-paper transition-colors hover:bg-accent"
          >
            <Building2 className="h-3.5 w-3.5" strokeWidth={1.5} />
            Novo empreendimento
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Empreendimentos"
          value={String(agencyDevelopments.length).padStart(2, "0")}
          note={`${agencyDevelopments.filter((d) => d.isPublished).length} publicados`}
          icon={Building2}
        />
        <StatCard
          label="Unidades livres"
          value={formatNumber(available.length)}
          note={`de ${formatNumber(units.length)} unidades`}
          icon={KeyRound}
        />
        <StatCard
          label="Leads recebidos"
          value={String(agencyLeads.length).padStart(2, "0")}
          note={`${newLeads.length} aguardando contato`}
          icon={Users}
          accent
        />
        <StatCard
          label="VGV disponível"
          value={formatCompactBRL(vgv)}
          note="soma das unidades livres"
          icon={Wallet}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-8">
          {/* Portfolio */}
          <section className="border border-line bg-paper-raised">
            <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-3.5 sm:px-5">
              <div>
                <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted/60">
                  Portfólio
                </p>
                <h2 className="mt-1 font-display text-xl text-ink">
                  Seus empreendimentos
                </h2>
              </div>
              <Link
                href="/painel/empreendimentos"
                className="inline-flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-ink"
              >
                Gerenciar
                <ArrowUpRight className="h-3 w-3" strokeWidth={1.75} />
              </Link>
            </div>

            <ul>
              {agencyDevelopments.map((development) => {
                const availableUnits = development.units.filter(
                  (unit) => unit.status === "available",
                ).length;
                return (
                  <li
                    key={development.id}
                    className="border-b border-line/70 px-4 py-4 last:border-b-0 sm:px-5"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <div className="relative h-20 w-full shrink-0 overflow-hidden border border-line bg-paper-deep sm:h-16 sm:w-24">
                        <Image
                          src={development.coverImage}
                          alt={development.name}
                          fill
                          sizes="96px"
                          className="object-cover"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate font-display text-lg leading-tight text-ink">
                            {development.name}
                          </h3>
                          <Badge tone={statusTone[development.status]}>
                            {developmentStatusLabels[development.status]}
                          </Badge>
                        </div>
                        <p className="mt-1 font-mono text-[8.5px] uppercase tracking-[0.12em] text-muted">
                          {development.address.neighborhood} ·{" "}
                          {development.address.city}/{development.address.state}
                        </p>

                        <div className="mt-3 flex items-center gap-3">
                          <UnitMix
                            units={development.units}
                            className="w-full max-w-40"
                          />
                          <span className="shrink-0 font-mono text-[8.5px] uppercase tracking-[0.12em] text-muted">
                            {availableUnits}/{development.units.length} livres
                          </span>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center justify-between gap-4 sm:flex-col sm:items-end">
                        <div className="text-left sm:text-right">
                          <p className="font-mono text-[7.5px] uppercase tracking-[0.12em] text-muted/60">
                            A partir
                          </p>
                          <p className="mt-0.5 font-display text-lg text-ink">
                            {formatBRL(development.pricing.minPrice)}
                          </p>
                        </div>
                        <Link
                          href={`/painel/empreendimentos/${development.id}`}
                          className="inline-flex items-center gap-1 border-b border-ink pb-0.5 font-mono text-[8px] uppercase tracking-[0.14em] text-ink transition-colors hover:text-accent hover:border-accent"
                        >
                          Editar
                          <ArrowUpRight className="h-3 w-3" strokeWidth={1.75} />
                        </Link>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Recent leads */}
          <section className="border border-line bg-paper-raised">
            <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-3.5 sm:px-5">
              <div>
                <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted/60">
                  Atividade
                </p>
                <h2 className="mt-1 font-display text-xl text-ink">
                  Leads recentes
                </h2>
              </div>
              <Link
                href="/painel/leads"
                className="inline-flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-ink"
              >
                Todos os leads
                <ArrowUpRight className="h-3 w-3" strokeWidth={1.75} />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left">
                <thead>
                  <tr className="border-b border-line/70 font-mono text-[7.5px] uppercase tracking-[0.14em] text-muted/50">
                    <th className="px-4 py-2.5 font-normal sm:px-5">Contato</th>
                    <th className="px-3 py-2.5 font-normal">Empreendimento</th>
                    <th className="px-3 py-2.5 font-normal">Status</th>
                    <th className="px-4 py-2.5 text-right font-normal sm:px-5">
                      Recebido
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentLeads.map((lead) => {
                    const development = agencyDevelopments.find(
                      (item) => item.id === lead.developmentId,
                    );
                    const unit = development?.units.find(
                      (item) => item.id === lead.unitId,
                    );
                    return (
                      <tr
                        key={lead.id}
                        className="border-b border-line/60 last:border-b-0"
                      >
                        <td className="px-4 py-3 sm:px-5">
                          <p className="text-[12px] text-ink">{lead.name}</p>
                          <p className="mt-0.5 font-mono text-[8px] text-muted/60">
                            {lead.phone}
                          </p>
                        </td>
                        <td className="px-3 py-3">
                          <p className="max-w-40 truncate text-[11.5px] text-ink-soft">
                            {development?.name}
                          </p>
                          <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.1em] text-muted/50">
                            {unit ? `Unidade ${unit.code}` : "Sem unidade"}
                          </p>
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={cn(
                              "inline-flex px-2 py-1 font-mono text-[7.5px] uppercase leading-none tracking-[0.12em]",
                              leadStatusTone[lead.status],
                            )}
                          >
                            {leadStatusLabels[lead.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-[8.5px] uppercase tracking-[0.1em] text-muted/60 sm:px-5">
                          {formatDate(lead.createdAt, {
                            day: "2-digit",
                            month: "short",
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="space-y-4 xl:col-span-4">
          {/* Next steps */}
          <section className="border border-line bg-ink text-paper">
            <div className="border-b border-paper/10 px-4 py-3.5">
              <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-paper/35">
                Prioridades
              </p>
              <h2 className="mt-1 font-display text-xl text-paper">
                Próximos passos
              </h2>
            </div>
            <ul className="px-4 py-2">
              {[
                {
                  label: "Responder os leads novos",
                  detail: `${newLeads.length} aguardando`,
                  href: "/painel/leads",
                  done: newLeads.length === 0,
                },
                {
                  label: "Revisar preços das unidades",
                  detail: `${available.length} livres`,
                  href: "/painel/empreendimentos/dev_alto",
                  done: false,
                },
                {
                  label: "Enviar uma maquete GLB",
                  detail: "Pátio Girassol",
                  href: "/painel/empreendimentos/dev_patio",
                  done: false,
                },
                {
                  label: "Completar o SEO do site",
                  detail: "Alto do Parque",
                  href: "/painel/empreendimentos/dev_alto",
                  done: false,
                },
              ].map((task) => (
                <li key={task.label}>
                  <Link
                    href={task.href}
                    className="group flex items-start gap-2.5 border-b border-paper/10 py-3 last:border-b-0"
                  >
                    <Circle
                      className={cn(
                        "mt-0.5 h-3.5 w-3.5 shrink-0",
                        task.done ? "text-forest-soft" : "text-paper/25",
                      )}
                      strokeWidth={1.5}
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block text-[11.5px] leading-snug",
                          task.done
                            ? "text-paper/35 line-through"
                            : "text-paper/80",
                        )}
                      >
                        {task.label}
                      </span>
                      <span className="mt-0.5 block font-mono text-[7.5px] uppercase tracking-[0.12em] text-paper/30">
                        {task.detail}
                      </span>
                    </span>
                    <ArrowUpRight
                      className="mt-0.5 h-3 w-3 shrink-0 text-paper/25 transition-colors group-hover:text-paper"
                      strokeWidth={1.75}
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* Unit mix */}
          <section className="border border-line bg-paper-raised p-4">
            <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted/60">
              Estoque
            </p>
            <div className="mt-1 flex items-end justify-between gap-3">
              <h2 className="font-display text-lg text-ink">Todas as unidades</h2>
              <span className="font-mono text-[9px] text-muted">
                {units.length} no total
              </span>
            </div>
            <UnitMix units={units} showLabels className="mt-4" />
          </section>

          {/* Storage */}
          <section className="border border-line bg-paper-raised p-4">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted/60">
                Modelos 3D
              </p>
              <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-forest">
                GridFS
              </span>
            </div>
            <p className="mt-1 font-display text-lg text-ink">Armazenamento</p>
            <div className="mt-4 h-1.5 w-full bg-paper-deep">
              <div className="h-full w-[23%] bg-ink" />
            </div>
            <div className="mt-2 flex items-center justify-between font-mono text-[8px] uppercase tracking-[0.12em] text-muted/60">
              <span>3,6 MB usados</span>
              <span>8 MB por arquivo</span>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-muted">
              Os GLBs ficam no MongoDB, com limite de 8 MB e recomendação de 3
              MB por maquete.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  note,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string;
  note: string;
  icon: typeof Building2;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "border p-4",
        accent
          ? "border-accent/25 bg-accent-soft"
          : "border-line bg-paper-raised",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted/60">
          {label}
        </span>
        <Icon
          className={cn(
            "h-3.5 w-3.5",
            accent ? "text-accent" : "text-muted/50",
          )}
          strokeWidth={1.5}
        />
      </div>
      <p className="mt-3 font-display text-[32px] leading-none text-ink">
        {value}
      </p>
      <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.12em] text-muted/60">
        {note}
      </p>
    </div>
  );
}

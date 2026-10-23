"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Search,
  Users,
} from "lucide-react";
import type { Development, Lead, LeadStatus } from "@/models";
import { Select } from "@/components/ui/field";
import {
  formatBRL,
  formatDate,
  leadSourceLabels,
  leadStatusLabels,
  leadStatusTone,
  unitTypeLabels,
} from "@/lib/format";
import { cn, initials } from "@/lib/utils";

const TAB_ORDER: Array<{ key: "all" | LeadStatus; label: string }> = [
  { key: "all", label: "Todos" },
  { key: "new", label: "Novos" },
  { key: "contacted", label: "Contatados" },
  { key: "visiting", label: "Em visita" },
  { key: "proposal", label: "Proposta" },
  { key: "closed_won", label: "Ganhos" },
];

export function LeadBoard({
  leads: initialLeads,
  developments,
}: {
  leads: Lead[];
  developments: Development[];
}) {
  const [leads, setLeads] = useState(initialLeads);
  const [status, setStatus] = useState<"all" | LeadStatus>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(
    initialLeads[0]?.id ?? null,
  );
  const [savingId, setSavingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const counts = useMemo(
    () =>
      leads.reduce<Record<LeadStatus, number>>(
        (acc, lead) => {
          acc[lead.status] += 1;
          return acc;
        },
        {
          new: 0,
          contacted: 0,
          qualified: 0,
          visiting: 0,
          proposal: 0,
          closed_won: 0,
          closed_lost: 0,
        },
      ),
    [leads],
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return leads.filter((lead) => {
      if (status !== "all" && lead.status !== status) return false;
      if (!normalized) return true;
      const development = developments.find(
        (item) => item.id === lead.developmentId,
      );
      return [lead.name, lead.email, lead.phone, development?.name ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    });
  }, [leads, status, query, developments]);

  const selected =
    leads.find((lead) => lead.id === selectedId) ?? filtered[0] ?? null;
  const selectedDevelopment = selected
    ? developments.find((item) => item.id === selected.developmentId)
    : null;
  const selectedUnit =
    selectedDevelopment && selected?.unitId
      ? selectedDevelopment.units.find((unit) => unit.id === selected.unitId)
      : null;

  const updateStatus = async (lead: Lead, next: LeadStatus) => {
    setSavingId(lead.id);
    setError(null);
    setLeads((current) =>
      current.map((item) =>
        item.id === lead.id ? { ...item, status: next } : item,
      ),
    );
    try {
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!response.ok) throw new Error("UPDATE_FAILED");
      setNotice(`Lead de ${lead.name} movido para ${leadStatusLabels[next]}.`);
      window.setTimeout(() => setNotice(null), 3200);
    } catch {
      setLeads((current) =>
        current.map((item) => (item.id === lead.id ? lead : item)),
      );
      setError("Não foi possível atualizar o status do lead.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div>
      <div className="mt-5 flex flex-col gap-3 border-b border-line pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="no-scrollbar flex items-center gap-1 overflow-x-auto">
          {TAB_ORDER.map((tab) => {
            const count =
              tab.key === "all" ? leads.length : counts[tab.key];
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatus(tab.key)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 border px-2.5 py-1.5 font-mono text-[8px] uppercase tracking-[0.11em] transition-colors",
                  status === tab.key
                    ? "border-ink bg-ink text-paper"
                    : "border-line text-muted hover:border-ink/40 hover:text-ink",
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    "tabular-nums",
                    status === tab.key ? "text-paper/50" : "text-muted/50",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex w-full items-center gap-2 border-b border-line py-1.5 focus-within:border-ink sm:w-64">
          <Search className="h-3.5 w-3.5 shrink-0 text-muted/60" strokeWidth={1.5} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nome, e-mail ou projeto"
            className="w-full bg-transparent text-[11.5px] text-ink placeholder:text-muted/50 focus:outline-none"
          />
        </div>
      </div>

      {(notice || error) && (
        <p
          className={cn(
            "mt-3 border px-3 py-2 text-[11px]",
            error
              ? "border-accent/25 bg-accent-soft text-accent-strong"
              : "border-forest/20 bg-forest-soft text-forest",
          )}
        >
          {error ?? notice}
        </p>
      )}

      <div className="mt-4 grid gap-5 xl:grid-cols-3">
        <div className="border border-line bg-paper-raised xl:col-span-2">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted/60">
              {filtered.length} de {leads.length} leads
            </p>
            <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-muted/50">
              {counts.new} novos
            </p>
          </div>

          <div className="max-h-[610px] overflow-auto">
            <table className="w-full min-w-[560px] text-left">
              <thead className="sticky top-0 z-10 bg-paper-raised shadow-[0_1px_0_0] shadow-line">
                <tr className="font-mono text-[7.5px] uppercase tracking-[0.12em] text-muted/50">
                  <th className="px-4 py-2.5 font-normal">Contato</th>
                  <th className="px-3 py-2.5 font-normal">Empreendimento</th>
                  <th className="px-3 py-2.5 font-normal">Status</th>
                  <th className="px-4 py-2.5 text-right font-normal">Data</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead) => {
                  const development = developments.find(
                    (item) => item.id === lead.developmentId,
                  );
                  const unit = development?.units.find(
                    (item) => item.id === lead.unitId,
                  );
                  const active = selected?.id === lead.id;
                  return (
                    <tr
                      key={lead.id}
                      onClick={() => setSelectedId(lead.id)}
                      className={cn(
                        "cursor-pointer border-b border-line/60 transition-colors last:border-b-0",
                        active
                          ? "bg-paper-deep/60"
                          : "hover:bg-paper-deep/30",
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-paper-deep font-mono text-[8px] text-ink-soft">
                            {initials(lead.name)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-[12px] text-ink">
                              {lead.name}
                            </p>
                            <p className="mt-0.5 truncate font-mono text-[8px] text-muted/60">
                              {lead.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <p className="max-w-36 truncate text-[11px] text-ink-soft">
                          {development?.name ?? "—"}
                        </p>
                        <p className="mt-0.5 font-mono text-[7.5px] uppercase tracking-[0.1em] text-muted/50">
                          {unit ? `Unidade ${unit.code}` : "Sem unidade"}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={cn(
                            "inline-flex px-2 py-1 font-mono text-[7px] uppercase leading-none tracking-[0.1em]",
                            leadStatusTone[lead.status],
                          )}
                        >
                          {leadStatusLabels[lead.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-[8px] uppercase tracking-[0.08em] text-muted/60">
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

            {filtered.length === 0 && (
              <div className="px-5 py-14 text-center">
                <Users className="mx-auto h-5 w-5 text-muted/40" strokeWidth={1.25} />
                <p className="mt-3 text-[12px] text-muted">
                  Nenhum lead com esse filtro.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setStatus("all");
                    setQuery("");
                  }}
                  className="mt-2 font-mono text-[8px] uppercase tracking-[0.14em] text-accent"
                >
                  Limpar filtros
                </button>
              </div>
            )}
          </div>
        </div>

        <aside className="border border-line bg-paper-raised">
          {selected ? (
            <>
              <div className="border-b border-line p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink font-mono text-[10px] text-paper">
                      {initials(selected.name)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-display text-xl leading-tight text-ink">
                        {selected.name}
                      </p>
                      <p className="mt-0.5 font-mono text-[7.5px] uppercase tracking-[0.12em] text-muted/60">
                        {leadSourceLabels[selected.source]} ·{" "}
                        {formatDate(selected.createdAt)}
                      </p>
                    </div>
                  </div>
                  {savingId === selected.id && (
                    <Loader2
                      className="h-3.5 w-3.5 animate-spin text-muted"
                      strokeWidth={1.5}
                    />
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <a
                    href={`mailto:${selected.email}`}
                    className="inline-flex h-8 items-center gap-1.5 border border-line px-2.5 font-mono text-[7.5px] uppercase tracking-[0.1em] text-ink transition-colors hover:border-ink"
                  >
                    <Mail className="h-3 w-3" strokeWidth={1.5} />
                    E-mail
                  </a>
                  <a
                    href={`https://wa.me/55${selected.phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-8 items-center gap-1.5 border border-line px-2.5 font-mono text-[7.5px] uppercase tracking-[0.1em] text-ink transition-colors hover:border-ink"
                  >
                    <Phone className="h-3 w-3" strokeWidth={1.5} />
                    WhatsApp
                  </a>
                  {selectedUnit && selectedDevelopment && (
                    <Link
                      href={`/sites/${selectedDevelopment.slug}?unidade=${selectedUnit.id}`}
                      target="_blank"
                      className="inline-flex h-8 items-center gap-1.5 bg-ink px-2.5 font-mono text-[7.5px] uppercase tracking-[0.1em] text-paper transition-colors hover:bg-accent"
                    >
                      Ver unidade
                      <ArrowUpRight className="h-3 w-3" strokeWidth={1.75} />
                    </Link>
                  )}
                </div>
              </div>

              <div className="space-y-4 p-4">
                <div>
                  <p className="font-mono text-[7.5px] uppercase tracking-[0.12em] text-muted/50">
                    Status do atendimento
                  </p>
                  <Select
                    value={selected.status}
                    onChange={(event) =>
                      void updateStatus(
                        selected,
                        event.target.value as LeadStatus,
                      )
                    }
                    className="mt-1.5 h-9 text-[11px]"
                  >
                    {Object.entries(leadStatusLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <p className="font-mono text-[7.5px] uppercase tracking-[0.12em] text-muted/50">
                    Interesse
                  </p>
                  <p className="mt-1 text-[12px] text-ink">
                    {selectedDevelopment?.name ?? "—"}
                  </p>
                  {selectedUnit && (
                    <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.1em] text-muted">
                      Unidade {selectedUnit.code} ·{" "}
                      {unitTypeLabels[selectedUnit.type]} ·{" "}
                      {formatBRL(selectedUnit.pricing.basePrice)}
                    </p>
                  )}
                  {selectedDevelopment && (
                    <p className="mt-1 flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.1em] text-muted/60">
                      <MapPin className="h-2.5 w-2.5" strokeWidth={1.5} />
                      {selectedDevelopment.address.neighborhood},{" "}
                      {selectedDevelopment.address.city}
                    </p>
                  )}
                </div>

                <div>
                  <p className="flex items-center gap-1.5 font-mono text-[7.5px] uppercase tracking-[0.12em] text-muted/50">
                    <MessageSquare className="h-3 w-3" strokeWidth={1.5} />
                    Mensagem
                  </p>
                  <p className="mt-1.5 border-l-2 border-accent/40 pl-2.5 text-[11.5px] leading-relaxed text-ink-soft">
                    {selected.message || "Sem mensagem enviada."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 border-t border-line pt-3">
                  <div>
                    <p className="font-mono text-[7px] uppercase tracking-[0.12em] text-muted/50">
                      E-mail
                    </p>
                    <p className="mt-0.5 truncate text-[10.5px] text-ink-soft">
                      {selected.email}
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-[7px] uppercase tracking-[0.12em] text-muted/50">
                      Telefone
                    </p>
                    <p className="mt-0.5 text-[10.5px] text-ink-soft">
                      {selected.phone}
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-[7px] uppercase tracking-[0.12em] text-muted/50">
                      Última ação
                    </p>
                    <p className="mt-0.5 text-[10.5px] text-ink-soft">
                      {formatDate(selected.updatedAt)}
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-[7px] uppercase tracking-[0.12em] text-muted/50">
                      Protocolo
                    </p>
                    <p className="mt-0.5 font-mono text-[9px] text-ink-soft">
                      {selected.id}
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full min-h-64 flex-col items-center justify-center p-6 text-center">
              <Users className="h-5 w-5 text-muted/40" strokeWidth={1.25} />
              <p className="mt-3 text-[12px] text-muted">
                Selecione um lead para ver os detalhes.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

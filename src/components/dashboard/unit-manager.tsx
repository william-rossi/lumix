"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  Loader2,
  Search,
  Trash2,
} from "lucide-react";
import type { Development, Unit, UnitStatus } from "@/models";
import { Select } from "@/components/ui/field";
import {
  formatArea,
  formatBRL,
  unitStatusLabels,
  unitTypeLabels,
} from "@/lib/format";
import { cn } from "@/lib/utils";

const STATUS_TABS: Array<{ key: "all" | UnitStatus; label: string }> = [
  { key: "all", label: "Todas" },
  { key: "available", label: "Disponíveis" },
  { key: "reserved", label: "Reservadas" },
  { key: "sold", label: "Vendidas" },
  { key: "blocked", label: "Bloqueadas" },
];

export function UnitManager({
  development,
  onSaved,
}: {
  development: Development;
  onSaved: (message: string) => void;
}) {
  const router = useRouter();
  const [units, setUnits] = useState(development.units);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | UnitStatus>("all");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const counts = useMemo(
    () =>
      units.reduce(
        (acc, unit) => {
          acc[unit.status] += 1;
          return acc;
        },
        { available: 0, reserved: 0, sold: 0, blocked: 0 },
      ),
    [units],
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return units.filter((unit) => {
      if (status !== "all" && unit.status !== status) return false;
      if (!normalized) return true;
      return [unit.code, unit.name, unitTypeLabels[unit.type]]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    });
  }, [units, query, status]);

  const patchUnit = async (unit: Unit, patch: Partial<Unit>, message: string) => {
    setSavingId(unit.id);
    setError(null);
    try {
      const response = await fetch(`/api/units/${unit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!response.ok) throw new Error("UPDATE_FAILED");
      const data = (await response.json()) as { unit?: Unit };
      if (data.unit) {
        setUnits((current) =>
          current.map((item) => (item.id === unit.id ? data.unit! : item)),
        );
      }
      setSavedId(unit.id);
      window.setTimeout(() => setSavedId(null), 1600);
      onSaved(message);
      router.refresh();
    } catch {
      setError(`Não foi possível atualizar a unidade ${unit.code}.`);
    } finally {
      setSavingId(null);
    }
  };

  const changeStatus = (unit: Unit, next: UnitStatus) => {
    setUnits((current) =>
      current.map((item) =>
        item.id === unit.id ? { ...item, status: next } : item,
      ),
    );
    void patchUnit(unit, { status: next }, `Unidade ${unit.code} atualizada.`);
  };

  const changePrice = (unit: Unit, raw: string) => {
    const reais = Number(raw.replace(/[^\d]/g, ""));
    if (!Number.isFinite(reais) || reais <= 0) {
      setError("Informe um preço válido.");
      return;
    }
    const cents = Math.round(reais * 100);
    if (cents === unit.pricing.basePrice) return;
    const pricing = {
      ...unit.pricing,
      basePrice: cents,
      pricePerSqm: Math.round(cents / unit.area.total),
    };
    setUnits((current) =>
      current.map((item) =>
        item.id === unit.id ? { ...item, pricing } : item,
      ),
    );
    void patchUnit(
      unit,
      { pricing },
      `Preço da unidade ${unit.code} atualizado.`,
    );
  };

  const removeUnit = async (unit: Unit) => {
    if (
      !window.confirm(
        `Remover a unidade ${unit.code}? Essa ação não pode ser desfeita.`,
      )
    ) {
      return;
    }
    setSavingId(unit.id);
    try {
      const response = await fetch(`/api/units/${unit.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("DELETE_FAILED");
      setUnits((current) => current.filter((item) => item.id !== unit.id));
      onSaved(`Unidade ${unit.code} removida.`);
      router.refresh();
    } catch {
      setError("Não foi possível remover a unidade.");
    } finally {
      setSavingId(null);
    }
  };

  const exportCsv = () => {
    const header = [
      "codigo",
      "nome",
      "andar",
      "tipologia",
      "area_total",
      "preco_brl",
      "status",
    ];
    const rows = units.map((unit) => [
      unit.code,
      unit.name,
      String(unit.floor),
      unitTypeLabels[unit.type],
      String(unit.area.total),
      (unit.pricing.basePrice / 100).toFixed(2),
      unitStatusLabels[unit.status],
    ]);
    const csv = [header, ...rows]
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");
    const blob = new Blob([`\ufeff${csv}`], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `unidades-${development.slug}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="border border-line bg-paper-raised">
      <div className="flex flex-col gap-3 border-b border-line px-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-5">
        <div>
          <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-accent">
            01
          </p>
          <h2 className="mt-1 font-display text-xl text-ink">
            Unidades do empreendimento
          </h2>
          <p className="mt-0.5 text-[11px] text-muted">
            Edite preço e status direto na tabela. As mudanças aparecem no site
            imediatamente.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex h-9 items-center gap-1.5 border border-line px-3 font-mono text-[8px] uppercase tracking-[0.12em] text-ink transition-colors hover:border-ink"
          >
            <Download className="h-3 w-3" strokeWidth={1.5} />
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-b border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="no-scrollbar flex items-center gap-1 overflow-x-auto">
          {STATUS_TABS.map((tab) => {
            const count =
              tab.key === "all" ? units.length : counts[tab.key as UnitStatus];
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatus(tab.key)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 border px-2 py-1 font-mono text-[7.5px] uppercase tracking-[0.1em] transition-colors",
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

        <div className="flex w-full items-center gap-2 border-b border-line py-1 focus-within:border-ink sm:w-56">
          <Search className="h-3.5 w-3.5 shrink-0 text-muted/60" strokeWidth={1.5} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por código ou tipologia"
            className="w-full bg-transparent text-[11.5px] text-ink placeholder:text-muted/50 focus:outline-none"
          />
        </div>
      </div>

      {error && (
        <p className="border-b border-accent/20 bg-accent-soft px-4 py-2 text-[11px] text-accent-strong sm:px-5">
          {error}
        </p>
      )}

      <div className="max-h-[620px] overflow-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead className="sticky top-0 z-10 bg-paper-raised shadow-[0_1px_0_0] shadow-line">
            <tr className="font-mono text-[7.5px] uppercase tracking-[0.12em] text-muted/50">
              <th className="px-4 py-2.5 font-normal sm:px-5">Unidade</th>
              <th className="px-3 py-2.5 font-normal">Andar</th>
              <th className="px-3 py-2.5 font-normal">Tipologia</th>
              <th className="px-3 py-2.5 font-normal">Área</th>
              <th className="px-3 py-2.5 font-normal">Preço</th>
              <th className="px-3 py-2.5 font-normal">Status</th>
              <th className="px-4 py-2.5 text-right font-normal sm:px-5">
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((unit) => {
              const saving = savingId === unit.id;
              const saved = savedId === unit.id;
              return (
                <tr
                  key={unit.id}
                  className={cn(
                    "border-b border-line/60 transition-colors last:border-b-0",
                    saving && "bg-paper-deep/40",
                  )}
                >
                  <td className="px-4 py-2.5 sm:px-5">
                    <p className="text-[12px] text-ink">
                      <span className="font-mono text-[10px] text-muted/70">
                        {unit.code}
                      </span>{" "}
                      {unit.name}
                    </p>
                    <p className="mt-0.5 font-mono text-[7.5px] uppercase tracking-[0.1em] text-muted/40">
                      {unit.id}
                    </p>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[10.5px] text-ink-soft">
                    {unit.floor}º
                  </td>
                  <td className="px-3 py-2.5 text-[11px] text-ink-soft">
                    {unitTypeLabels[unit.type]}
                  </td>
                  <td className="px-3 py-2.5 text-[11px] text-ink-soft">
                    {formatArea(unit.area.total)}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1 border-b border-transparent focus-within:border-ink">
                      <span className="font-mono text-[9px] text-muted/60">
                        R$
                      </span>
                      <input
                        key={`${unit.id}-${unit.pricing.basePrice}`}
                        defaultValue={String(
                          Math.round(unit.pricing.basePrice / 100),
                        )}
                        inputMode="numeric"
                        onBlur={(event) => changePrice(unit, event.target.value)}
                        className="w-24 bg-transparent font-mono text-[11px] text-ink focus:outline-none"
                        aria-label={`Preço da unidade ${unit.code}`}
                      />
                    </div>
                    <p className="mt-0.5 font-mono text-[7px] uppercase tracking-[0.08em] text-muted/40">
                      {formatBRL(unit.pricing.basePrice)}
                    </p>
                  </td>
                  <td className="px-3 py-2.5">
                    <Select
                      value={unit.status}
                      onChange={(event) =>
                        changeStatus(unit, event.target.value as UnitStatus)
                      }
                      className="h-8 w-32 text-[10.5px]"
                      aria-label={`Status da unidade ${unit.code}`}
                    >
                      {Object.entries(unitStatusLabels).map(
                        ([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ),
                      )}
                    </Select>
                  </td>
                  <td className="px-4 py-2.5 sm:px-5">
                    <div className="flex items-center justify-end gap-2">
                      {saving ? (
                        <Loader2
                          className="h-3.5 w-3.5 animate-spin text-muted"
                          strokeWidth={1.5}
                        />
                      ) : saved ? (
                        <span className="font-mono text-[7px] uppercase tracking-[0.1em] text-forest">
                          salvo
                        </span>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => void removeUnit(unit)}
                        disabled={saving}
                        className="flex h-7 w-7 items-center justify-center border border-transparent text-muted/60 transition-colors hover:border-line hover:text-accent disabled:opacity-40"
                        aria-label={`Remover unidade ${unit.code}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="px-5 py-12 text-center">
            <p className="text-[12px] text-muted">
              Nenhuma unidade encontrada com esse filtro.
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setStatus("all");
              }}
              className="mt-2 font-mono text-[8px] uppercase tracking-[0.14em] text-accent"
            >
              Limpar filtros
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 sm:px-5">
        <p className="font-mono text-[7.5px] uppercase tracking-[0.12em] text-muted/50">
          {filtered.length} de {units.length} unidades ·{" "}
          {counts.available} disponíveis
        </p>
        <p className="font-mono text-[7.5px] uppercase tracking-[0.12em] text-muted/40">
          Edição otimista · persistida via /api/units
        </p>
      </div>
    </section>
  );
}

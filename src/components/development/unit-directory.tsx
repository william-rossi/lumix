"use client";

import { useMemo, useState } from "react";
import { ArrowDownUp, Search } from "lucide-react";
import type { Unit, UnitStatus, UnitType } from "@/models";
import { UnitStatusBadge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/field";
import {
  formatArea,
  formatCompactBRL,
  unitTypeLabels,
} from "@/lib/format";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | UnitStatus;
type SortKey = "price-asc" | "price-desc" | "area-desc" | "floor-asc";

const STATUS_TABS: Array<{ key: StatusFilter; label: string }> = [
  { key: "all", label: "Todas" },
  { key: "available", label: "Disponíveis" },
  { key: "reserved", label: "Reservadas" },
  { key: "sold", label: "Vendidas" },
];

export function UnitDirectory({
  units,
  onSelect,
  selectedUnitId,
}: {
  units: Unit[];
  onSelect: (unitId: string) => void;
  selectedUnitId: string | null;
}) {
  const [status, setStatus] = useState<StatusFilter>("all");
  const [type, setType] = useState<"all" | UnitType>("all");
  const [sort, setSort] = useState<SortKey>("price-asc");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    return units.reduce(
      (acc, unit) => {
        acc[unit.status] += 1;
        return acc;
      },
      { available: 0, reserved: 0, sold: 0, blocked: 0 } as Record<UnitStatus, number>,
    );
  }, [units]);

  const types = useMemo(() => {
    const unique = new Set(units.map((unit) => unit.type));
    return Array.from(unique);
  }, [units]);

  const filtered = useMemo(() => {
    const list = units.filter((unit) => {
      if (status !== "all" && unit.status !== status) return false;
      if (type !== "all" && unit.type !== type) return false;
      if (query) {
        const haystack = `${unit.code} ${unit.name ?? ""}`.toLowerCase();
        if (!haystack.includes(query.toLowerCase())) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      switch (sort) {
        case "price-asc":
          return a.pricing.basePrice - b.pricing.basePrice;
        case "price-desc":
          return b.pricing.basePrice - a.pricing.basePrice;
        case "area-desc":
          return b.area.total - a.area.total;
        case "floor-asc":
          return a.floor - b.floor;
        default:
          return 0;
      }
    });
  }, [units, status, type, sort, query]);

  return (
    <div className="flex flex-col lg:min-h-0 lg:flex-1">
      <div className="sticky top-0 z-10 border-b border-line bg-paper px-5 pb-3 pt-5">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl text-ink">Unidades</h2>
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
            {filtered.length} de {units.length}
          </span>
        </div>

        <div className="mt-3 flex gap-1 overflow-x-auto pb-1 no-scrollbar">
          {STATUS_TABS.map((tab) => {
            const count =
              tab.key === "all" ? units.length : counts[tab.key as UnitStatus];
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatus(tab.key)}
                className={cn(
                  "shrink-0 border px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] transition-colors",
                  status === tab.key
                    ? "border-ink bg-ink text-paper"
                    : "border-line text-muted hover:border-ink/40 hover:text-ink",
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    "ml-1.5 tabular-nums",
                    status === tab.key ? "text-paper/55" : "text-muted/55",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted/60" strokeWidth={1.5} />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por código…"
              className="h-9 pl-5 text-[12px]"
              aria-label="Buscar unidade"
            />
          </div>
          <Select
            value={type}
            onChange={(event) => setType(event.target.value as "all" | UnitType)}
            className="h-9 w-32 text-[11px]"
            aria-label="Filtrar por tipologia"
          >
            <option value="all">Tipologia</option>
            {types.map((unitType) => (
              <option key={unitType} value={unitType}>
                {unitTypeLabels[unitType]}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
        <div className="flex items-center justify-between border-b border-line px-5 py-2">
          <span className="font-mono text-[8.5px] uppercase tracking-[0.16em] text-muted/60">
            Código · tipologia
          </span>
          <button
            type="button"
            onClick={() =>
              setSort((current) => (current === "price-asc" ? "price-desc" : "price-asc"))
            }
            className="flex items-center gap-1.5 font-mono text-[8.5px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-ink"
          >
            <ArrowDownUp className="h-3 w-3" strokeWidth={1.5} />
            {sort === "price-asc" ? "Menor preço" : "Maior preço"}
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="font-display text-xl text-ink">Nenhuma unidade</p>
            <p className="mt-2 text-[12px] text-muted">
              Ajuste os filtros para ver outras opções.
            </p>
          </div>
        ) : (
          <ul>
            {filtered.map((unit) => (
              <li key={unit.id}>
                <button
                  type="button"
                  onClick={() => onSelect(unit.id)}
                  className={cn(
                    "group flex w-full items-center justify-between gap-4 border-b border-line/70 px-5 py-3 text-left transition-colors hover:bg-paper-deep/40",
                    selectedUnitId === unit.id && "bg-paper-deep/60",
                  )}
                >
                  <span className="min-w-0">
                    <span className="flex items-baseline gap-2">
                      <span className="font-mono text-[11px] tabular-nums text-ink">
                        {unit.code}
                      </span>
                      <span className="truncate text-[12px] text-ink-soft">
                        {unit.name}
                      </span>
                    </span>
                    <span className="mt-0.5 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
                      <span>{unitTypeLabels[unit.type]}</span>
                      <span className="h-2.5 w-px bg-line-strong" />
                      <span>{formatArea(unit.area.total)}</span>
                      <span className="h-2.5 w-px bg-line-strong" />
                      <span>{unit.floor}º andar</span>
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <span className="font-display text-base text-ink">
                      {formatCompactBRL(unit.pricing.basePrice)}
                    </span>
                    <UnitStatusBadge status={unit.status} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

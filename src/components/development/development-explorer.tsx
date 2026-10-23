"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Box, Check, Share2 } from "lucide-react";
import type { Agency, Development, Unit } from "@/models";
import { BuildingViewerLoader } from "@/components/viewer/viewer-loader";
import { UnitDirectory } from "@/components/development/unit-directory";
import { UnitDetail } from "@/components/development/unit-detail";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import {
  developmentStatusLabels,
  formatArea,
  formatBRL,
  formatCompactBRL,
  formatDate,
} from "@/lib/format";
import { cn, copyToClipboard, developmentHost, initials } from "@/lib/utils";

export function DevelopmentExplorer({
  development,
  agency,
}: {
  development: Development;
  agency: Agency;
}) {
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [activeFloor, setActiveFloor] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const units = development.units;
  const selectedUnit = useMemo(
    () => units.find((unit) => unit.id === selectedUnitId) ?? null,
    [units, selectedUnitId],
  );

  const available = units.filter((unit) => unit.status === "available");
  const areaRange = useMemo(() => {
    if (units.length === 0) return null;
    const areas = units.map((unit) => unit.area.total);
    return { min: Math.min(...areas), max: Math.max(...areas) };
  }, [units]);

  const syncUrl = useCallback((code: string | null) => {
    const params = new URLSearchParams(window.location.search);
    if (code) params.set("unidade", code);
    else params.delete("unidade");
    const query = params.toString();
    history.replaceState(
      null,
      "",
      `${window.location.pathname}${query ? `?${query}` : ""}`,
    );
  }, []);

  const selectUnit = useCallback(
    (unitId: string) => {
      const unit = units.find((item) => item.id === unitId);
      if (!unit) return;
      setSelectedUnitId(unitId);
      setActiveFloor(unit.floor);
      syncUrl(unit.code);
    },
    [units, syncUrl],
  );

  const clearSelection = useCallback(() => {
    setSelectedUnitId(null);
    setActiveFloor(null);
    syncUrl(null);
  }, [syncUrl]);

  const handleFloorChange = useCallback((floor: number | null) => {
    setActiveFloor(floor);
  }, []);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("unidade");
    if (!code) return;
    const unit = units.find(
      (item) => item.code.toLowerCase() === code.toLowerCase(),
    );
    if (!unit) return;
    const frame = window.requestAnimationFrame(() => {
      setSelectedUnitId(unit.id);
      setActiveFloor(unit.floor);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [units]);

  const share = async () => {
    const ok = await copyToClipboard(
      `${window.location.origin}${window.location.pathname}`,
    );
    setCopied(ok);
    if (ok) setTimeout(() => setCopied(false), 2200);
  };

  const interest = (unit: Unit) => {
    window.dispatchEvent(
      new CustomEvent("lumix:interest", {
        detail: { unitId: unit.id, code: unit.code, name: unit.name },
      }),
    );
    document.getElementById("contato")?.scrollIntoView({ behavior: "smooth" });
  };

  const floors = useMemo(() => {
    const set = new Set(units.map((unit) => unit.floor));
    return Array.from(set).sort((a, b) => b - a);
  }, [units]);

  return (
    <section id="explorar" className="border-b border-line bg-paper">
      <div className="grid lg:grid-cols-12">
        {/* Mobile compact identity */}
        <div className="order-1 border-b border-line px-5 pb-5 pt-6 lg:hidden">
          <div className="flex items-center gap-2">
            <Badge tone="accent">{developmentStatusLabels[development.status]}</Badge>
            <Badge tone="outline">
              <Box className="h-3 w-3" strokeWidth={1.5} />
              3D
            </Badge>
          </div>
          <h1 className="mt-3 text-[clamp(1.9rem,7vw,2.8rem)] leading-[0.98] tracking-[-0.02em] text-ink">
            {development.name}
          </h1>
          <div className="mt-2 flex items-end justify-between gap-3">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
                {development.address.neighborhood} · {development.address.city}
              </p>
              <p className="mt-1 font-display text-2xl text-ink">
                {formatBRL(development.pricing.minPrice)}
                <span className="ml-1.5 font-sans text-[9px] uppercase tracking-[0.12em] text-muted">
                  a partir de
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={share}
              className="flex h-9 w-9 items-center justify-center border border-line text-muted"
              aria-label="Compartilhar empreendimento"
            >
              {copied ? (
                <Check className="h-4 w-4 text-forest" strokeWidth={1.75} />
              ) : (
                <Share2 className="h-4 w-4" strokeWidth={1.5} />
              )}
            </button>
          </div>
        </div>

        {/* 3D stage */}
        <div className="order-2 lg:col-span-7 xl:col-span-8 lg:order-1">
          <div className="relative h-[58vh] min-h-[420px] lg:h-[calc(100svh-4rem)] lg:max-h-[820px] lg:min-h-[620px]">
            <BuildingViewerLoader
              development={development}
              selectedUnitId={selectedUnitId}
              onSelectUnit={selectUnit}
              onClearSelection={clearSelection}
              activeFloor={activeFloor}
              onFloorChange={handleFloorChange}
            />
          </div>

          <div className="no-scrollbar flex items-center gap-1 overflow-x-auto border-t border-stage-line bg-stage px-3 py-2 sm:hidden">
            <button
              type="button"
              onClick={() => handleFloorChange(null)}
              className={cn(
                "shrink-0 border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em]",
                activeFloor === null
                  ? "border-paper/40 text-paper"
                  : "border-transparent text-paper/40",
              )}
            >
              Todos
            </button>
            {floors.map((floor) => {
              const free = units.filter(
                (unit) => unit.floor === floor && unit.status === "available",
              ).length;
              return (
                <button
                  key={floor}
                  type="button"
                  onClick={() =>
                    handleFloorChange(activeFloor === floor ? null : floor)
                  }
                  className={cn(
                    "shrink-0 border px-2 py-1 font-mono text-[9px] tabular-nums uppercase tracking-[0.12em]",
                    activeFloor === floor
                      ? "border-accent text-accent"
                      : free > 0
                        ? "border-transparent text-paper/55"
                        : "border-transparent text-paper/20",
                  )}
                >
                  {String(floor).padStart(2, "0")}
                </button>
              );
            })}
          </div>
        </div>

        {/* Side panel */}
        <aside className="order-3 flex flex-col border-t border-line bg-paper lg:order-2 lg:col-span-5 lg:h-[calc(100svh-4rem)] lg:max-h-[820px] lg:min-h-[620px] lg:border-l lg:border-t-0 xl:col-span-4">
          {selectedUnit ? (
            <UnitDetail
              unit={selectedUnit}
              development={development}
              onBack={clearSelection}
              onInterest={interest}
            />
          ) : (
            <>
              <div className="hidden border-b border-line px-5 pb-5 pt-6 lg:block">
                <div className="flex items-center gap-2">
                  <Badge tone="accent">
                    {developmentStatusLabels[development.status]}
                  </Badge>
                  <Badge tone="outline">
                    <Box className="h-3 w-3" strokeWidth={1.5} />
                    Maquete 3D
                  </Badge>
                  <button
                    type="button"
                    onClick={share}
                    className="ml-auto flex h-7 w-7 items-center justify-center text-muted transition-colors hover:text-ink"
                    aria-label="Compartilhar empreendimento"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-forest" strokeWidth={1.75} />
                    ) : (
                      <Share2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                    )}
                  </button>
                </div>

                <h1 className="mt-3.5 text-[clamp(1.9rem,2.7vw,2.85rem)] leading-[0.96] tracking-[-0.025em] text-ink">
                  {development.name}
                </h1>
                <p className="mt-2 font-display text-[15px] italic text-muted">
                  {development.tagline}
                </p>
                <p className="mt-2 font-mono text-[9px] uppercase leading-relaxed tracking-[0.14em] text-muted">
                  {development.address.street}, {development.address.number}
                  <br />
                  {development.address.neighborhood} · {development.address.city} /{" "}
                  {development.address.state}
                </p>

                <dl className="mt-4 grid grid-cols-4 gap-2 border-y border-line py-3">
                  <MiniStat
                    label="Entrega"
                    value={
                      development.deliveryDate
                        ? formatDate(development.deliveryDate, {
                            month: "short",
                            year: "2-digit",
                          })
                        : "—"
                    }
                  />
                  <MiniStat label="Andares" value={String(development.model3d.massing.floors)} />
                  <MiniStat label="Livres" value={String(available.length)} />
                  <MiniStat
                    label="Área"
                    value={
                      areaRange
                        ? `${Math.round(areaRange.min)}–${Math.round(areaRange.max)}`
                        : "—"
                    }
                  />
                </dl>

                <div className="mt-3.5 flex items-end justify-between gap-3">
                  <div>
                    <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted/70">
                      A partir de
                    </p>
                    <p className="font-display text-[26px] leading-none text-ink">
                      {formatBRL(development.pricing.minPrice)}
                    </p>
                  </div>
                  <Link
                    href="#contato"
                    className={buttonStyles({ variant: "accent", size: "sm" })}
                  >
                    Falar com corretor
                    <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </Link>
                </div>

                <div className="mt-4 flex items-center gap-2.5 border-t border-line pt-3">
                  <span className="flex h-8 w-8 items-center justify-center border border-line font-display text-[11px] text-ink">
                    {initials(agency.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[11px] text-ink">{agency.name}</p>
                    <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-muted">
                      {agency.creci}
                    </p>
                  </div>
                  <Link
                    href={`/imobiliarias/${agency.slug}`}
                    className="ml-auto font-mono text-[8px] uppercase tracking-[0.12em] text-muted underline-offset-4 hover:text-ink hover:underline"
                  >
                    Perfil
                  </Link>
                </div>
              </div>

              <UnitDirectory
                units={units}
                onSelect={selectUnit}
                selectedUnitId={selectedUnitId}
              />

              <div className="border-t border-line px-5 py-3 lg:hidden">
                <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted/60">
                  {developmentHost(development.slug)}
                </p>
                <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted">
                  <span>{formatArea(areaRange?.min ?? 0)} – {formatArea(areaRange?.max ?? 0)}</span>
                  <span className="text-line-strong">·</span>
                  <span>{development.model3d.massing.floors} andares</span>
                  <span className="text-line-strong">·</span>
                  <span>{formatCompactBRL(development.pricing.maxPrice)} máx.</span>
                </div>
              </div>
            </>
          )}
        </aside>
      </div>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[7.5px] uppercase tracking-[0.12em] text-muted/60">
        {label}
      </dt>
      <dd className="mt-0.5 text-[12px] tabular-nums text-ink">{value}</dd>
    </div>
  );
}

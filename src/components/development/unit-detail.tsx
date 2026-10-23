"use client";

import Image from "next/image";
import { useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Layers,
  Share2,
} from "lucide-react";
import type { Development, Unit } from "@/models";
import { Badge, UnitStatusBadge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Lightbox } from "@/components/ui/lightbox";
import { UnitFloorPlan } from "@/components/development/unit-floor-plan";
import {
  formatArea,
  formatBRL,
  formatCompactBRL,
  formatDate,
  orientationLabels,
  pricePerSqm,
  unitTypeLabels,
} from "@/lib/format";
import { cn, copyToClipboard, developmentHost } from "@/lib/utils";

export function UnitDetail({
  unit,
  development,
  onBack,
  onInterest,
}: {
  unit: Unit;
  development: Development;
  onBack: () => void;
  onInterest: (unit: Unit) => void;
}) {
  const images = unit.images.length > 0 ? unit.images : development.gallery;
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [showPlan, setShowPlan] = useState(false);
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = `${window.location.origin}${window.location.pathname}?unidade=${unit.code}`;
    const ok = await copyToClipboard(url);
    setCopied(ok);
    if (ok) setTimeout(() => setCopied(false), 2200);
  };

  const installment = Math.round(
    (unit.pricing.basePrice *
      (1 - (unit.pricing.paymentPlan?.downPayment ?? 20) / 100)) /
      (unit.pricing.paymentPlan?.installments ?? 36),
  );
  const planInstallments = unit.pricing.paymentPlan?.installments ?? 36;

  return (
    <div className="flex flex-col lg:min-h-0 lg:flex-1">
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-paper/95 px-4 py-2.5 backdrop-blur-sm">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
          Todas as unidades
        </button>
        <button
          type="button"
          onClick={share}
          className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-ink"
          aria-label="Copiar link desta unidade"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-forest" strokeWidth={1.75} />
          ) : (
            <Share2 className="h-3.5 w-3.5" strokeWidth={1.5} />
          )}
          {copied ? "Copiado" : "Compartilhar"}
        </button>
      </div>

      <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
        <div className="relative">
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-paper-deep">
            <Image
              src={images[galleryIndex]?.url ?? development.coverImage}
              alt={images[galleryIndex]?.alt ?? unit.name ?? unit.code}
              fill
              sizes="(min-width: 1280px) 33vw, (min-width: 1024px) 40vw, 100vw"
              className="cursor-zoom-in object-cover transition-transform duration-500 hover:scale-[1.02]"
              onClick={() => setLightboxOpen(true)}
            />
            <div className="absolute left-3 top-3 flex items-center gap-2">
              <UnitStatusBadge status={unit.status} />
              <Badge tone="dark" className="bg-stage/55 backdrop-blur-sm">
                {unit.floor}º andar
              </Badge>
            </div>
            <span className="absolute bottom-3 right-3 font-mono text-[9px] uppercase tracking-[0.14em] text-white/80">
              {String(galleryIndex + 1).padStart(2, "0")} /{" "}
              {String(images.length).padStart(2, "0")}
            </span>
          </div>

          {images.length > 1 && (
            <div className="no-scrollbar flex gap-1 overflow-x-auto border-b border-line p-1.5">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setGalleryIndex(index)}
                  aria-label={`Ver foto ${index + 1}`}
                  className={cn(
                    "relative h-12 w-16 shrink-0 overflow-hidden border transition-opacity",
                    index === galleryIndex
                      ? "border-ink"
                      : "border-transparent opacity-55 hover:opacity-100",
                  )}
                >
                  <Image
                    src={image.url}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 py-5">
          <p className="eyebrow text-muted">
            Unidade {unit.code} · {unitTypeLabels[unit.type]}
          </p>
          <h2 className="mt-1.5 font-display text-[28px] leading-[1.05] text-ink">
            {unit.name ?? `Unidade ${unit.code}`}
          </h2>
          <p className="mt-1 text-[12px] text-muted">
            {unit.area.total} m² · {orientationLabels[unit.orientation]} ·{" "}
            {development.address.neighborhood}
          </p>

          <div className="mt-4 flex items-end justify-between gap-3 border-y border-line py-3.5">
            <div>
              <p className="font-mono text-[8.5px] uppercase tracking-[0.16em] text-muted/70">
                Valor de venda
              </p>
              <p className="mt-0.5 font-display text-[30px] leading-none text-ink">
                {formatBRL(unit.pricing.basePrice)}
              </p>
              <p className="mt-1 font-mono text-[9px] text-muted">
                {formatBRL(pricePerSqm(unit.pricing.basePrice, unit.area.total))} / m²
              </p>
            </div>
            {unit.pricing.promotions?.[0] && (
              <Badge tone="accent">{unit.pricing.promotions[0].name}</Badge>
            )}
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
            <Stat label="Área privativa" value={formatArea(unit.area.private)} />
            <Stat
              label="Área total"
              value={formatArea(unit.area.total)}
            />
            <Stat
              label="Dormitórios"
              value={`${unit.rooms.bedrooms || "—"}${unit.rooms.suites ? ` · ${unit.rooms.suites} suíte${unit.rooms.suites > 1 ? "s" : ""}` : ""}`}
            />
            <Stat
              label="Vagas"
              value={unit.rooms.parkingSpaces ? `${unit.rooms.parkingSpaces}` : "—"}
            />
            {unit.area.balcony ? (
              <Stat label="Varanda" value={formatArea(unit.area.balcony)} />
            ) : null}
            <Stat label="Banheiros" value={`${unit.rooms.bathrooms + unit.rooms.halfBathrooms}`} />
          </dl>

          <div className="mt-5 border border-line bg-paper-raised p-4">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[8.5px] uppercase tracking-[0.16em] text-muted/70">
                Condições de pagamento
              </p>
              <span className="font-mono text-[8.5px] uppercase tracking-[0.12em] text-muted/60">
                {unit.pricing.paymentPlan?.correctionIndex ?? "INCC"}
              </span>
            </div>
            <p className="mt-2 font-display text-xl text-ink">
              {planInstallments}× {formatCompactBRL(installment)}
            </p>
            <p className="mt-0.5 text-[11px] text-muted">
              Entrada de {unit.pricing.paymentPlan?.downPayment ?? 20}% + saldo na
              entrega. Simulação sujeita a análise.
            </p>
            {unit.pricing.paymentPlan?.balloonPayments?.map((balloon) => (
              <p
                key={balloon.description}
                className="mt-2 border-t border-line pt-2 font-mono text-[9px] uppercase tracking-[0.1em] text-muted/70"
              >
                {balloon.description}
              </p>
            ))}
          </div>

          <dl className="mt-4 space-y-2 border-t border-line pt-3 text-[11px]">
            <CostRow
              label="Condomínio estimado"
              value={
                unit.pricing.condoFeeEstimate
                  ? `${formatBRL(unit.pricing.condoFeeEstimate)}/mês`
                  : "—"
              }
            />
            <CostRow
              label="IPTU estimado"
              value={
                unit.pricing.iptuEstimate
                  ? `${formatBRL(unit.pricing.iptuEstimate)}/mês`
                  : "—"
              }
            />
            <CostRow
              label="Entrega"
              value={
                development.deliveryDate
                  ? formatDate(development.deliveryDate, {
                      month: "short",
                      year: "numeric",
                    })
                  : "—"
              }
            />
          </dl>

          {unit.features.length > 0 && (
            <ul className="mt-5 space-y-1.5 border-t border-line pt-4">
              {unit.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-[12px] text-ink-soft">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-forest" strokeWidth={1.75} />
                  {feature}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-5 border-t border-line pt-4">
            <button
              type="button"
              onClick={() => setShowPlan((value) => !value)}
              className="flex w-full items-center justify-between text-left"
              aria-expanded={showPlan}
            >
              <span className="flex items-center gap-2 text-[12px] text-ink">
                <Layers className="h-4 w-4" strokeWidth={1.5} />
                Planta esquemática
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted transition-transform",
                  showPlan && "rotate-180",
                )}
                strokeWidth={1.5}
              />
            </button>
            {showPlan && (
              <div className="mt-3 border border-line bg-paper-raised p-3">
                <UnitFloorPlan unit={unit} />
                <p className="mt-2 text-center font-mono text-[8px] uppercase tracking-[0.14em] text-muted/50">
                  Planta ilustrativa · consulte a versão oficial
                </p>
              </div>
            )}
          </div>

          {unit.description && (
            <p className="mt-5 border-t border-line pt-4 text-[12px] leading-relaxed text-muted">
              {unit.description}
            </p>
          )}

          <p className="mt-5 font-mono text-[8.5px] uppercase tracking-[0.12em] text-muted/50">
            {developmentHost(development.slug)} · unidade {unit.code}
          </p>
        </div>
      </div>

      <div className="sticky bottom-0 z-20 border-t border-line bg-paper p-3.5">
        <Button
          type="button"
          variant="accent"
          className="w-full"
          onClick={() => onInterest(unit)}
        >
          Tenho interesse nesta unidade
        </Button>
        <button
          type="button"
          onClick={() => setShowPlan((value) => !value)}
          className={buttonStyles({
            variant: "ghost",
            size: "sm",
            className: "mt-1 w-full text-muted",
          })}
        >
          <Layers className="h-3.5 w-3.5" strokeWidth={1.5} />
          {showPlan ? "Ocultar planta" : "Ver planta da unidade"}
        </button>
      </div>

      {lightboxOpen && (
        <Lightbox
          items={images}
          index={galleryIndex}
          onClose={() => setLightboxOpen(false)}
          onIndexChange={setGalleryIndex}
        />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted/60">
        {label}
      </dt>
      <dd className="mt-0.5 text-[13px] text-ink">{value}</dd>
    </div>
  );
}

function CostRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-muted">{label}</dt>
      <dd className="tabular-nums text-ink-soft">{value}</dd>
    </div>
  );
}

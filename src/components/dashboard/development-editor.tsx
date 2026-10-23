"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Box,
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Layers,
  Loader2,
  Table2,
} from "lucide-react";
import type { Agency, Development } from "@/models";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { developmentStatusLabels } from "@/lib/format";
import { OverviewForm } from "@/components/dashboard/overview-form";
import { ModelPanel } from "@/components/dashboard/model-panel";
import { UnitManager } from "@/components/dashboard/unit-manager";
import { SeoPanel } from "@/components/dashboard/seo-panel";

const statusTone = {
  launching: "accent",
  under_construction: "amber",
  ready: "available",
  sold_out: "sold",
} as const;

type Tab = "overview" | "model" | "units" | "seo";

const tabs: Array<{
  key: Tab;
  label: string;
  icon: typeof Box;
  hash: string;
}> = [
  { key: "overview", label: "Visão geral", icon: ImageIcon, hash: "#geral" },
  { key: "model", label: "Maquete 3D", icon: Box, hash: "#maquete" },
  { key: "units", label: "Unidades", icon: Table2, hash: "#unidades" },
  { key: "seo", label: "Galeria e SEO", icon: Eye, hash: "#seo" },
];

export function DevelopmentEditor({
  development,
  agency,
}: {
  development: Development;
  agency: Agency;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [published, setPublished] = useState(development.isPublished);
  const [publishing, setPublishing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    const matched = tabs.find((item) => item.hash === `#${hash}`);
    if (!matched) return;
    const frame = window.requestAnimationFrame(() => setTab(matched.key));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const selectTab = (item: (typeof tabs)[number]) => {
    setTab(item.key);
    if (window.location.hash !== item.hash) {
      window.history.replaceState(null, "", item.hash);
    }
  };

  const notify = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 4000);
  };

  const togglePublished = async () => {
    if (publishing) return;
    setPublishing(true);
    const next = !published;
    try {
      const response = await fetch(`/api/developments/${development.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: next }),
      });
      if (!response.ok) throw new Error("Falha ao atualizar a publicação");
      setPublished(next);
      notify(next ? "Empreendimento publicado." : "Empreendimento despublicado.");
      router.refresh();
    } catch {
      notify("Não foi possível alterar a publicação.");
    } finally {
      setPublishing(false);
    }
  };

  const publicHref = `/sites/${development.slug}`;

  return (
    <div className="mx-auto max-w-[1180px]">
      <div className="flex flex-wrap items-center gap-2 font-mono text-[8px] uppercase tracking-[0.14em] text-muted">
        <Link href="/painel" className="hover:text-ink">
          Painel
        </Link>
        <span className="text-line-strong">/</span>
        <Link href="/painel/empreendimentos" className="hover:text-ink">
          Empreendimentos
        </Link>
        <span className="text-line-strong">/</span>
        <span className="text-ink">{development.name}</span>
      </div>

      <div className="mt-5 flex flex-col gap-5 border border-line bg-paper-raised p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-center gap-4">
          <div className="relative h-16 w-20 shrink-0 overflow-hidden border border-line bg-paper-deep">
            <Image
              src={development.coverImage}
              alt={development.name}
              fill
              sizes="80px"
              className="object-cover"
            />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={statusTone[development.status]}>
                {developmentStatusLabels[development.status]}
              </Badge>
              <span
                className={cn(
                  "inline-flex items-center gap-1 font-mono text-[7.5px] uppercase tracking-[0.12em]",
                  published ? "text-forest" : "text-muted",
                )}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    published ? "bg-forest" : "bg-line-strong",
                  )}
                />
                {published ? "Publicado" : "Rascunho"}
              </span>
            </div>
            <h1 className="mt-2 truncate font-display text-2xl leading-tight text-ink sm:text-[28px]">
              {development.name}
            </h1>
            <p className="mt-1 truncate font-mono text-[8.5px] uppercase tracking-[0.12em] text-muted">
              {agency.name} · {development.address.neighborhood} ·{" "}
              {development.address.city}/{development.address.state}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {published ? (
            <a
              href={publicHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center gap-1.5 border border-line px-3 font-mono text-[8px] uppercase tracking-[0.13em] text-ink transition-colors hover:border-ink"
            >
              <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
              Ver site
            </a>
          ) : (
            <span
              title="Publique o empreendimento para abrir o site"
              className="inline-flex h-9 cursor-not-allowed items-center gap-1.5 border border-line px-3 font-mono text-[8px] uppercase tracking-[0.13em] text-muted/40"
            >
              <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
              Publique para ver
            </span>
          )}
          <button
            type="button"
            onClick={togglePublished}
            disabled={publishing}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 px-3 font-mono text-[8px] uppercase tracking-[0.13em] transition-colors",
              published
                ? "border border-line text-muted hover:border-ink hover:text-ink"
                : "bg-ink text-paper hover:bg-accent",
            )}
          >
            {publishing ? (
              <Loader2 className="h-3 w-3 animate-spin" strokeWidth={1.75} />
            ) : published ? (
              <EyeOff className="h-3 w-3" strokeWidth={1.5} />
            ) : (
              <Eye className="h-3 w-3" strokeWidth={1.5} />
            )}
            {published ? "Despublicar" : "Publicar"}
          </button>
          {published ? (
            <a
              href={publicHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center gap-1 bg-accent px-3 font-mono text-[8px] uppercase tracking-[0.13em] text-white transition-colors hover:bg-accent-strong"
            >
              Abrir 3D
              <ArrowUpRight className="h-3 w-3" strokeWidth={1.75} />
            </a>
          ) : (
            <button
              type="button"
              onClick={() => {
                window.location.hash = "maquete";
              }}
              className="inline-flex h-9 items-center gap-1 bg-accent px-3 font-mono text-[8px] uppercase tracking-[0.13em] text-white transition-colors hover:bg-accent-strong"
            >
              Ver maquete
              <ArrowUpRight className="h-3 w-3" strokeWidth={1.75} />
            </button>
          )}
        </div>
      </div>

      <div className="no-scrollbar mt-5 flex overflow-x-auto border-b border-line">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => selectTab(item)}
            className={cn(
              "flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 font-mono text-[8.5px] uppercase tracking-[0.14em] transition-colors",
              tab === item.key
                ? "border-accent text-ink"
                : "border-transparent text-muted hover:text-ink",
            )}
          >
            <item.icon className="h-3.5 w-3.5" strokeWidth={1.5} />
            {item.label}
            {item.key === "units" && (
              <span className="text-[7.5px] text-muted/60">
                {development.units.length}
              </span>
            )}
            {item.key === "model" && development.model3d.storage && (
              <Check className="h-3 w-3 text-forest" strokeWidth={2} />
            )}
          </button>
        ))}
      </div>

      {notice && (
        <div className="mt-4 flex items-center gap-2 border border-forest/20 bg-forest-soft px-3 py-2.5 text-[11.5px] text-forest">
          <Check className="h-3.5 w-3.5" strokeWidth={2} />
          {notice}
        </div>
      )}

      <div className="mt-6">
        {tab === "overview" && (
          <OverviewForm development={development} onSaved={notify} />
        )}
        {tab === "model" && (
          <ModelPanel development={development} onSaved={notify} />
        )}
        {tab === "units" && (
          <UnitManager development={development} onSaved={notify} />
        )}
        {tab === "seo" && (
          <SeoPanel development={development} onSaved={notify} />
        )}
      </div>

      <p className="mt-8 flex items-center gap-2 font-mono text-[7.5px] uppercase tracking-[0.14em] text-muted/40">
        <Layers className="h-3 w-3" strokeWidth={1.5} />
        Edição em modo demonstração · alterações persistem na sessão do servidor
      </p>
    </div>
  );
}

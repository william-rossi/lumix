"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Check,
  Copy,
  ImageIcon,
  Loader2,
  Save,
  Star,
  Trash2,
} from "lucide-react";
import type { Development } from "@/models";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { developmentHost } from "@/lib/utils";

export function SeoPanel({
  development,
  onSaved,
}: {
  development: Development;
  onSaved: (message: string) => void;
}) {
  const router = useRouter();
  const [gallery, setGallery] = useState(development.gallery);
  const [cover, setCover] = useState(development.coverImage);
  const [title, setTitle] = useState(development.seo.title);
  const [description, setDescription] = useState(development.seo.description);
  const [keywords, setKeywords] = useState(
    development.seo.keywords.join(", "),
  );
  const ogImage = development.seo.ogImage ?? development.coverImage;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const publicLink = `https://${developmentHost(development.slug)}`;

  const saveSeo = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/developments/${development.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seo: {
            ...development.seo,
            title,
            description,
            keywords: keywords
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
            ogImage,
          },
        }),
      });
      if (!response.ok) throw new Error("SAVE_FAILED");
      onSaved("Configurações de SEO salvas.");
      router.refresh();
    } catch {
      setError("Não foi possível salvar o SEO.");
    } finally {
      setSaving(false);
    }
  };

  const patchGallery = async (
    nextGallery: typeof gallery,
    nextCover: string,
    message: string,
  ) => {
    setError(null);
    try {
      const response = await fetch(`/api/developments/${development.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gallery: nextGallery.map((item, index) => ({
            ...item,
            order: index,
          })),
          coverImage: nextCover,
        }),
      });
      if (!response.ok) throw new Error("SAVE_FAILED");
      setGallery(nextGallery.map((item, index) => ({ ...item, order: index })));
      setCover(nextCover);
      onSaved(message);
      router.refresh();
    } catch {
      setError("Não foi possível atualizar a galeria.");
    }
  };

  const setAsCover = (url: string) => {
    if (cover === url) return;
    void patchGallery(gallery, url, "Capa do empreendimento atualizada.");
  };

  const removeImage = (id: string) => {
    if (gallery.length <= 1) {
      setError("A galeria precisa de pelo menos uma imagem.");
      return;
    }
    const removed = gallery.find((item) => item.id === id);
    const next = gallery.filter((item) => item.id !== id);
    const nextCover =
      removed && cover === removed.url ? next[0]?.url ?? cover : cover;
    void patchGallery(next, nextCover, "Imagem removida da galeria.");
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Não foi possível copiar o link.");
    }
  };

  const removeDevelopment = async () => {
    if (
      !window.confirm(
        `Excluir "${development.name}"? Unidades, galeria e leads vinculados deixarão de aparecer.`,
      )
    ) {
      return;
    }
    try {
      const response = await fetch(`/api/developments/${development.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("DELETE_FAILED");
      router.push("/painel/empreendimentos");
      router.refresh();
    } catch {
      setError("Não foi possível excluir o empreendimento.");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <section className="border border-line bg-paper-raised">
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3.5 sm:px-5">
            <div>
              <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-accent">
                01
              </p>
              <h2 className="mt-1 font-display text-lg text-ink">Galeria</h2>
              <p className="mt-0.5 text-[11px] text-muted">
                Define a capa e as imagens exibidas na página pública.
              </p>
            </div>
            <span className="shrink-0 font-mono text-[8px] uppercase tracking-[0.12em] text-muted/60">
              {gallery.length} imagens
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-3 sm:p-5">
            {gallery.map((image) => (
              <div
                key={image.id}
                className="group relative aspect-[4/3] overflow-hidden border border-line bg-paper-deep"
              >
                <Image
                  src={image.url}
                  alt={image.alt}
                  fill
                  sizes="(min-width: 640px) 220px, 45vw"
                  className="object-cover"
                />
                {cover === image.url && (
                  <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 bg-ink px-1.5 py-0.5 font-mono text-[6.5px] uppercase tracking-[0.12em] text-paper">
                    <Star className="h-2 w-2" strokeWidth={2} />
                    capa
                  </span>
                )}
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-stage/85 to-transparent p-1.5 pt-4 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                  <button
                    type="button"
                    onClick={() => setAsCover(image.url)}
                    className="bg-paper px-1.5 py-0.5 font-mono text-[6.5px] uppercase tracking-[0.1em] text-ink"
                  >
                    capa
                  </button>
                  <button
                    type="button"
                    onClick={() => removeImage(image.id)}
                    aria-label="Remover imagem"
                    className="flex h-5 w-5 items-center justify-center bg-stage/80 text-paper transition-colors hover:bg-accent"
                  >
                    <Trash2 className="h-2.5 w-2.5" strokeWidth={1.75} />
                  </button>
                </div>
              </div>
            ))}
            <div className="flex aspect-[4/3] flex-col items-center justify-center border border-dashed border-line-strong bg-paper text-center">
              <ImageIcon className="h-4 w-4 text-muted/50" strokeWidth={1.5} />
              <p className="mt-1.5 max-w-24 font-mono text-[6.5px] uppercase leading-relaxed tracking-[0.1em] text-muted/50">
                Upload de mídia em breve
              </p>
            </div>
          </div>

          <p className="border-t border-line px-4 py-2.5 font-mono text-[7.5px] uppercase tracking-[0.12em] text-muted/40 sm:px-5">
            Imagens demonstrativas do projeto · em produção, upload via GridFS
          </p>
        </section>

        <form onSubmit={saveSeo} className="border border-line bg-paper-raised">
          <div className="border-b border-line px-4 py-3.5 sm:px-5">
            <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-accent">
              02
            </p>
            <h2 className="mt-1 font-display text-lg text-ink">
              SEO e compartilhamento
            </h2>
            <p className="mt-0.5 text-[11px] text-muted">
              Como o empreendimento aparece no Google e nas redes sociais.
            </p>
          </div>

          <div className="grid gap-4 p-4 sm:p-5">
            <Field
              label="Título (até 60 caracteres)"
              htmlFor="seo-title"
              hint={`${title.length}/60`}
            >
              <Input
                id="seo-title"
                variant="boxed"
                value={title}
                maxLength={80}
                onChange={(event) => setTitle(event.target.value)}
              />
            </Field>
            <Field
              label="Descrição (até 160 caracteres)"
              htmlFor="seo-description"
              hint={`${description.length}/160`}
            >
              <Textarea
                id="seo-description"
                variant="boxed"
                value={description}
                maxLength={200}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
              />
            </Field>
            <Field
              label="Palavras-chave"
              htmlFor="seo-keywords"
              hint="Separadas por vírgula."
            >
              <Input
                id="seo-keywords"
                variant="boxed"
                value={keywords}
                onChange={(event) => setKeywords(event.target.value)}
              />
            </Field>

            <div className="border border-line bg-paper p-3">
              <p className="font-mono text-[7.5px] uppercase tracking-[0.12em] text-muted/50">
                Prévia no Google
              </p>
              <p className="mt-2 font-mono text-[9px] lowercase text-forest">
                {developmentHost(development.slug)}
              </p>
              <p className="mt-1 line-clamp-1 text-[15px] text-[#1a0dab]">
                {title || development.name}
              </p>
              <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-muted">
                {description || development.description}
              </p>
            </div>

            {error && (
              <p className="text-[11px] text-accent-strong">{error}</p>
            )}

            <div className="flex justify-end">
              <Button type="submit" variant="accent" size="md" disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
                ) : (
                  <Save className="h-4 w-4" strokeWidth={1.75} />
                )}
                {saving ? "Salvando" : "Salvar SEO"}
              </Button>
            </div>
          </div>
        </form>
      </div>

      <aside className="space-y-4">
        <div className="border border-line bg-paper-raised p-4">
          <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted/60">
            Endereço público
          </p>
          <p className="mt-2 break-all font-mono text-[10px] leading-relaxed text-ink">
            {publicLink}
          </p>
          {development.isPublished ? (
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={copyLink}
                className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 border border-line px-2 font-mono text-[7.5px] uppercase tracking-[0.12em] text-ink transition-colors hover:border-ink"
              >
                {copied ? (
                  <Check className="h-3 w-3" strokeWidth={2} />
                ) : (
                  <Copy className="h-3 w-3" strokeWidth={1.75} />
                )}
                {copied ? "Copiado" : "Copiar"}
              </button>
              <Link
                href={`/sites/${development.slug}`}
                target="_blank"
                className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 bg-ink px-2 font-mono text-[7.5px] uppercase tracking-[0.12em] text-paper transition-colors hover:bg-accent"
              >
                Abrir
                <ArrowUpRight className="h-3 w-3" strokeWidth={1.75} />
              </Link>
            </div>
          ) : (
            <p className="mt-3 border border-line bg-paper px-3 py-2 font-mono text-[8px] uppercase tracking-[0.12em] text-muted">
              Rascunho · publique para ativar
            </p>
          )}
          <p className="mt-3 text-[10.5px] leading-relaxed text-muted">
            Em produção, este endereço é servido por subdomínio via{" "}
            <span className="font-mono text-[9px]">proxy.ts</span>. No demo, o
            link equivalente é{" "}
            {development.isPublished ? (
              <Link
                href={`/sites/${development.slug}`}
                className="text-accent underline underline-offset-2"
              >
                /sites/{development.slug}
              </Link>
            ) : (
              <span className="font-mono text-[9px] text-ink">
                /sites/{development.slug}
              </span>
            )}
            .
          </p>
        </div>

        <div className="border border-line bg-paper-raised p-4">
          <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted/60">
            Estrutura
          </p>
          <dl className="mt-3 space-y-2.5">
            <div className="flex items-center justify-between border-b border-line/70 pb-2">
              <dt className="text-[11px] text-muted">Imagens na galeria</dt>
              <dd className="font-mono text-[10px] text-ink">{gallery.length}</dd>
            </div>
            <div className="flex items-center justify-between border-b border-line/70 pb-2">
              <dt className="text-[11px] text-muted">Mapeamentos 3D</dt>
              <dd className="font-mono text-[10px] text-ink">
                {development.model3d.unitsMapping.length}
              </dd>
            </div>
            <div className="flex items-center justify-between border-b border-line/70 pb-2">
              <dt className="text-[11px] text-muted">Unidades</dt>
              <dd className="font-mono text-[10px] text-ink">
                {development.units.length}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-[11px] text-muted">Publicado</dt>
              <dd className="font-mono text-[10px] text-ink">
                {development.isPublished ? "sim" : "não"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="border border-accent/25 bg-accent-soft/40 p-4">
          <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-accent-strong">
            Zona de risco
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-ink-soft">
            Excluir remove o empreendimento da plataforma e o desvincula do
            diretório público.
          </p>
          <button
            type="button"
            onClick={removeDevelopment}
            className="mt-3 inline-flex h-8 items-center gap-1.5 border border-accent/40 px-3 font-mono text-[7.5px] uppercase tracking-[0.12em] text-accent-strong transition-colors hover:bg-accent hover:text-white"
          >
            <Trash2 className="h-3 w-3" strokeWidth={1.75} />
            Excluir empreendimento
          </button>
        </div>
      </aside>
    </div>
  );
}

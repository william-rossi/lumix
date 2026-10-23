"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Loader2, Save } from "lucide-react";
import type { Development } from "@/models";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import {
  developmentStatusLabels,
  developmentTypeLabels,
  formatNumber,
} from "@/lib/format";
import { cn, developmentHost } from "@/lib/utils";

const COVERS = [
  { url: "/examples/ap-1.jpg", label: "Living" },
  { url: "/examples/ap-2.jpg", label: "Cozinha" },
  { url: "/examples/ap-3.webp", label: "Suíte" },
  { url: "/examples/ap-4.webp", label: "Banho" },
  { url: "/examples/ap-5.avif", label: "Vista" },
];

function toDateInput(value?: Date) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

export function OverviewForm({
  development,
  onSaved,
}: {
  development: Development;
  onSaved: (message: string) => void;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: development.name,
    slug: development.slug,
    tagline: development.tagline ?? "",
    description: development.description,
    status: development.status,
    type: development.type,
    street: development.address.street,
    number: development.address.number,
    complement: development.address.complement ?? "",
    neighborhood: development.address.neighborhood,
    city: development.address.city,
    state: development.address.state,
    zipCode: development.address.zipCode,
    minPrice: String(Math.round(development.pricing.minPrice / 100)),
    maxPrice: String(Math.round(development.pricing.maxPrice / 100)),
    launchDate: toDateInput(development.launchDate),
    deliveryDate: toDateInput(development.deliveryDate),
    coverImage: development.coverImage,
    highlights: development.highlights.join("\n"),
  });

  const update = <Key extends keyof typeof form>(
    key: Key,
    value: (typeof form)[Key],
  ) => setForm((current) => ({ ...current, [key]: value }));

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;

    if (form.name.trim().length < 3) {
      setError("O nome precisa ter pelo menos 3 caracteres.");
      return;
    }

    const minPrice = Math.round(Number(form.minPrice) * 100);
    const maxPrice = Math.round(
      Number(form.maxPrice || form.minPrice) * 100,
    );
    if (!Number.isFinite(minPrice) || minPrice <= 0) {
      setError("Informe um preço mínimo válido.");
      return;
    }
    if (!Number.isFinite(maxPrice) || maxPrice < minPrice) {
      setError("O preço máximo precisa ser maior que o mínimo.");
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      tagline: form.tagline.trim() || undefined,
      description: form.description.trim(),
      status: form.status,
      type: form.type,
      address: {
        ...development.address,
        street: form.street.trim(),
        number: form.number.trim(),
        complement: form.complement.trim() || undefined,
        neighborhood: form.neighborhood.trim(),
        city: form.city.trim(),
        state: form.state.trim().toUpperCase(),
        zipCode: form.zipCode.trim(),
        country: "Brasil",
      },
      pricing: {
        ...development.pricing,
        minPrice,
        maxPrice,
      },
      launchDate: form.launchDate
        ? new Date(`${form.launchDate}T12:00:00`).toISOString()
        : undefined,
      deliveryDate: form.deliveryDate
        ? new Date(`${form.deliveryDate}T12:00:00`).toISOString()
        : undefined,
      coverImage: form.coverImage,
      highlights: form.highlights
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    };

    try {
      const response = await fetch(`/api/developments/${development.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(data?.error ?? "SAVE_FAILED");
      }
      onSaved("Informações do empreendimento salvas.");
      router.refresh();
    } catch {
      setError("Não foi possível salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save}>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="border border-line bg-paper-raised">
            <FormHeader
              index="01"
              title="Identidade"
              description="Nome, posicionamento e estágio do empreendimento."
            />
            <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
              <Field label="Nome" htmlFor="dev-name" className="sm:col-span-2">
                <Input
                  id="dev-name"
                  variant="boxed"
                  value={form.name}
                  onChange={(event) => update("name", event.target.value)}
                  required
                />
              </Field>

              <Field
                label="Slug / subdomínio"
                htmlFor="dev-slug"
                className="sm:col-span-2"
                hint={
                  form.slug
                    ? `Endereço público: ${developmentHost(form.slug)}`
                    : "Use apenas letras, números e hífens."
                }
              >
                <Input
                  id="dev-slug"
                  variant="boxed"
                  value={form.slug}
                  onChange={(event) =>
                    update(
                      "slug",
                      event.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-]/g, "-")
                        .replace(/-+/g, "-"),
                    )
                  }
                />
              </Field>

              <Field
                label="Tagline"
                htmlFor="dev-tagline"
                className="sm:col-span-2"
              >
                <Input
                  id="dev-tagline"
                  variant="boxed"
                  value={form.tagline}
                  onChange={(event) => update("tagline", event.target.value)}
                  placeholder="Uma frase curta sobre o projeto"
                />
              </Field>

              <Field
                label="Descrição"
                htmlFor="dev-description"
                className="sm:col-span-2"
              >
                <Textarea
                  id="dev-description"
                  variant="boxed"
                  value={form.description}
                  onChange={(event) =>
                    update("description", event.target.value)
                  }
                  rows={5}
                />
              </Field>

              <Field label="Estágio" htmlFor="dev-status">
                <Select
                  id="dev-status"
                  variant="boxed"
                  value={form.status}
                  onChange={(event) =>
                    update(
                      "status",
                      event.target.value as Development["status"],
                    )
                  }
                >
                  {Object.entries(developmentStatusLabels).map(
                    ([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ),
                  )}
                </Select>
              </Field>

              <Field label="Tipologia" htmlFor="dev-type">
                <Select
                  id="dev-type"
                  variant="boxed"
                  value={form.type}
                  onChange={(event) =>
                    update("type", event.target.value as Development["type"])
                  }
                >
                  {Object.entries(developmentTypeLabels).map(
                    ([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ),
                  )}
                </Select>
              </Field>
            </div>
          </section>

          <section className="border border-line bg-paper-raised">
            <FormHeader
              index="02"
              title="Endereço"
              description="Onde o empreendimento existe — usado na busca por região."
            />
            <div className="grid gap-4 p-4 sm:grid-cols-6 sm:p-5">
              <Field
                label="Logradouro"
                htmlFor="dev-street"
                className="sm:col-span-4"
              >
                <Input
                  id="dev-street"
                  variant="boxed"
                  value={form.street}
                  onChange={(event) => update("street", event.target.value)}
                />
              </Field>
              <Field label="Número" htmlFor="dev-number" className="sm:col-span-2">
                <Input
                  id="dev-number"
                  variant="boxed"
                  value={form.number}
                  onChange={(event) => update("number", event.target.value)}
                />
              </Field>
              <Field
                label="Complemento"
                htmlFor="dev-complement"
                className="sm:col-span-3"
              >
                <Input
                  id="dev-complement"
                  variant="boxed"
                  value={form.complement}
                  onChange={(event) => update("complement", event.target.value)}
                />
              </Field>
              <Field
                label="Bairro"
                htmlFor="dev-neighborhood"
                className="sm:col-span-3"
              >
                <Input
                  id="dev-neighborhood"
                  variant="boxed"
                  value={form.neighborhood}
                  onChange={(event) =>
                    update("neighborhood", event.target.value)
                  }
                />
              </Field>
              <Field label="Cidade" htmlFor="dev-city" className="sm:col-span-3">
                <Input
                  id="dev-city"
                  variant="boxed"
                  value={form.city}
                  onChange={(event) => update("city", event.target.value)}
                />
              </Field>
              <Field label="UF" htmlFor="dev-state" className="sm:col-span-1">
                <Input
                  id="dev-state"
                  variant="boxed"
                  value={form.state}
                  maxLength={2}
                  onChange={(event) =>
                    update("state", event.target.value.toUpperCase())
                  }
                />
              </Field>
              <Field label="CEP" htmlFor="dev-zip" className="sm:col-span-2">
                <Input
                  id="dev-zip"
                  variant="boxed"
                  value={form.zipCode}
                  onChange={(event) => update("zipCode", event.target.value)}
                />
              </Field>
            </div>
          </section>

          <section className="border border-line bg-paper-raised">
            <FormHeader
              index="03"
              title="Comercial"
              description="Faixa de preço, cronograma e destaques do projeto."
            />
            <div className="grid gap-4 p-4 sm:grid-cols-4 sm:p-5">
              <Field label="Preço mínimo (R$)" htmlFor="dev-min-price">
                <Input
                  id="dev-min-price"
                  variant="boxed"
                  type="number"
                  min={0}
                  step={1000}
                  value={form.minPrice}
                  onChange={(event) => update("minPrice", event.target.value)}
                />
              </Field>
              <Field label="Preço máximo (R$)" htmlFor="dev-max-price">
                <Input
                  id="dev-max-price"
                  variant="boxed"
                  type="number"
                  min={0}
                  step={1000}
                  value={form.maxPrice}
                  onChange={(event) => update("maxPrice", event.target.value)}
                />
              </Field>
              <Field label="Lançamento" htmlFor="dev-launch">
                <Input
                  id="dev-launch"
                  variant="boxed"
                  type="date"
                  value={form.launchDate}
                  onChange={(event) => update("launchDate", event.target.value)}
                />
              </Field>
              <Field label="Entrega" htmlFor="dev-delivery">
                <Input
                  id="dev-delivery"
                  variant="boxed"
                  type="date"
                  value={form.deliveryDate}
                  onChange={(event) =>
                    update("deliveryDate", event.target.value)
                  }
                />
              </Field>
              <Field
                label="Destaques"
                htmlFor="dev-highlights"
                hint="Um destaque por linha. Aparecem na página pública do empreendimento."
                className="sm:col-span-4"
              >
                <Textarea
                  id="dev-highlights"
                  variant="boxed"
                  value={form.highlights}
                  onChange={(event) =>
                    update("highlights", event.target.value)
                  }
                  rows={4}
                />
              </Field>
            </div>
          </section>

          <div className="sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-3 border border-line bg-paper-raised/95 px-4 py-3 backdrop-blur">
            <div className="min-w-0">
              <p className="font-mono text-[7.5px] uppercase tracking-[0.14em] text-muted/60">
                Última atualização
              </p>
              <p className="mt-0.5 text-[11px] text-ink-soft">
                {new Date(development.updatedAt).toLocaleString("pt-BR")}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {error && (
                <span className="text-[11px] text-accent-strong">{error}</span>
              )}
              <Button type="submit" variant="accent" size="md" disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
                ) : (
                  <Save className="h-4 w-4" strokeWidth={1.75} />
                )}
                {saving ? "Salvando" : "Salvar alterações"}
              </Button>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="border border-line bg-paper-raised p-4">
            <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted/60">
              Prévia do anúncio
            </p>
            <div className="relative mt-3 aspect-[4/3] overflow-hidden border border-line bg-paper-deep">
              <Image
                src={form.coverImage}
                alt={form.name || "Capa"}
                fill
                sizes="320px"
                className="object-cover"
              />
            </div>
            <p className="mt-3 font-mono text-[8px] lowercase tracking-[0.06em] text-muted/60">
              {form.slug ? developmentHost(form.slug) : "endereço pendente"}
            </p>
            <p className="mt-1 font-display text-xl leading-tight text-ink">
              {form.name || "Novo empreendimento"}
            </p>
            <p className="mt-1 line-clamp-2 text-[11.5px] leading-relaxed text-muted">
              {form.tagline || "A tagline aparece abaixo do nome no site."}
            </p>
            <div className="mt-3 flex items-center justify-between border-t border-line pt-3 font-mono text-[8px] uppercase tracking-[0.12em] text-muted">
              <span>{formatNumber(development.units.length)} unidades</span>
              <span>{development.address.neighborhood || "—"}</span>
            </div>
            <Link
              href={`/sites/${development.slug}`}
              target="_blank"
              className="mt-3 inline-flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.13em] text-accent"
            >
              Abrir página pública
              <ArrowUpRight className="h-3 w-3" strokeWidth={1.75} />
            </Link>
          </div>

          <div className="border border-line bg-paper-raised p-4">
            <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted/60">
              Imagem de capa
            </p>
            <div className="mt-3 grid grid-cols-5 gap-1.5">
              {COVERS.map((cover) => (
                <button
                  key={cover.url}
                  type="button"
                  onClick={() => update("coverImage", cover.url)}
                  aria-label={cover.label}
                  className={cn(
                    "relative aspect-square overflow-hidden border bg-paper-deep transition-all",
                    form.coverImage === cover.url
                      ? "border-ink ring-1 ring-ink ring-offset-1 ring-offset-paper-raised"
                      : "border-line opacity-70 hover:opacity-100",
                  )}
                >
                  <Image
                    src={cover.url}
                    alt={cover.label}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
            <p className="mt-2 text-[10.5px] leading-relaxed text-muted">
              No ambiente de demonstração, as capas vêm das fotos de exemplo do
              projeto. Em produção, o upload irá para o MongoDB.
            </p>
          </div>

          <div className="border border-ink/10 bg-paper-deep/60 p-4">
            <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-accent">
              Privacidade
            </p>
            <p className="mt-2 text-[11.5px] leading-relaxed text-ink-soft">
              Alterar nome, slug ou endereço não quebra os links antigos no
              MongoDB: as unidades continuam vinculadas pelo{" "}
              <span className="font-mono text-[10px]">unitId</span>, não pelo
              nome do nó 3D.
            </p>
          </div>
        </aside>
      </div>
    </form>
  );
}

function FormHeader({
  index,
  title,
  description,
}: {
  index: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line px-4 py-3.5 sm:px-5">
      <div>
        <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-accent">
          {index}
        </p>
        <h2 className="mt-1 font-display text-lg leading-tight text-ink">
          {title}
        </h2>
        <p className="mt-0.5 text-[11px] text-muted">{description}</p>
      </div>
    </div>
  );
}

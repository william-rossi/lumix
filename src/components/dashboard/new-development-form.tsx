"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Loader2,
  Sparkles,
} from "lucide-react";
import type { Agency } from "@/models";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import {
  developmentStatusLabels,
  developmentTypeLabels,
  formatNumber,
} from "@/lib/format";
import { developmentHost, slugify } from "@/lib/utils";

const COVERS = [
  { url: "/examples/ap-1.jpg", label: "Living" },
  { url: "/examples/ap-2.jpg", label: "Cozinha" },
  { url: "/examples/ap-3.webp", label: "Suíte" },
  { url: "/examples/ap-4.webp", label: "Banho" },
  { url: "/examples/ap-5.avif", label: "Vista" },
];

export function NewDevelopmentForm({ agency }: { agency: Agency }) {
  const router = useRouter();
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    tagline: "",
    description: "",
    status: "launching" as keyof typeof developmentStatusLabels,
    type: "residential" as keyof typeof developmentTypeLabels,
    city: "São Paulo",
    state: "SP",
    neighborhood: "",
    street: "",
    number: "",
    zipCode: "",
    minPrice: "900000",
    coverImage: COVERS[0].url,
    published: true,
  });

  const update = <Key extends keyof typeof form>(
    key: Key,
    value: (typeof form)[Key],
  ) => setForm((current) => ({ ...current, [key]: value }));

  const onNameChange = (value: string) => {
    setForm((current) => ({
      ...current,
      name: value,
      slug: slugTouched ? current.slug : slugify(value),
    }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;

    if (form.name.trim().length < 3) {
      setError("Informe o nome do empreendimento.");
      return;
    }
    if (!form.city.trim() || form.state.trim().length !== 2) {
      setError("Informe cidade e UF.");
      return;
    }
    const minPrice = Math.round(Number(form.minPrice) * 100);
    if (!Number.isFinite(minPrice) || minPrice <= 0) {
      setError("Informe um preço inicial válido.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/developments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agencyId: agency.id,
          name: form.name.trim(),
          slug: form.slug || slugify(form.name),
          tagline: form.tagline.trim() || undefined,
          description: form.description.trim(),
          status: form.status,
          type: form.type,
          model3d: undefined,
          coverImage: form.coverImage,
          isPublished: form.published,
          address: {
            street: form.street.trim(),
            number: form.number.trim(),
            neighborhood: form.neighborhood.trim(),
            city: form.city.trim(),
            state: form.state.trim().toUpperCase(),
            zipCode: form.zipCode.trim(),
            country: "Brasil",
          },
          pricing: {
            minPrice,
            maxPrice: minPrice,
            currency: "BRL",
            pricePerSqmRange: { min: 0, max: 0 },
          },
          highlights: [],
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | { development?: { id: string }; error?: string }
        | null;
      if (!response.ok || !data?.development) {
        throw new Error(data?.error ?? "CREATE_FAILED");
      }

      router.push(`/painel/empreendimentos/${data.development.id}`);
      router.refresh();
    } catch {
      setError("Não foi possível criar o empreendimento. Tente novamente.");
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1180px]">
      <Link
        href="/painel/empreendimentos"
        className="inline-flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-3 w-3" strokeWidth={1.75} />
        Voltar para empreendimentos
      </Link>

      <div className="mt-4 border-b border-line pb-6">
        <div className="flex items-center gap-2.5">
          <span className="eyebrow text-muted">Novo</span>
          <span className="h-px w-7 bg-line-strong" />
          <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted/60">
            {agency.name}
          </span>
        </div>
        <h1 className="mt-3 font-display text-[clamp(2rem,4vw,3rem)] leading-none text-ink">
          Um novo endereço.
        </h1>
        <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-muted">
          Cadastre o essencial agora. O sistema gera 40 unidades padrão (10
          andares × 4) e uma maquete procedural pronta para navegar — você refina
          depois.
        </p>
      </div>

      <form onSubmit={submit} className="mt-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <section className="border border-line bg-paper-raised">
              <div className="border-b border-line px-4 py-3.5 sm:px-5">
                <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-accent">
                  01
                </p>
                <h2 className="mt-1 font-display text-lg text-ink">Identidade</h2>
              </div>
              <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
                <Field
                  label="Nome"
                  htmlFor="new-name"
                  className="sm:col-span-2"
                  hint="Como o empreendimento aparece no diretório e no site."
                >
                  <Input
                    id="new-name"
                    variant="boxed"
                    value={form.name}
                    onChange={(event) => onNameChange(event.target.value)}
                    placeholder="Ex.: Alto do Parque"
                    required
                  />
                </Field>

                <Field
                  label="Slug / subdomínio"
                  htmlFor="new-slug"
                  className="sm:col-span-2"
                  hint={
                    form.slug
                      ? `Endereço: ${developmentHost(form.slug)}`
                      : "Gerado automaticamente a partir do nome."
                  }
                >
                  <Input
                    id="new-slug"
                    variant="boxed"
                    value={form.slug}
                    onChange={(event) => {
                      setSlugTouched(true);
                      update(
                        "slug",
                        event.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, "-")
                          .replace(/-+/g, "-"),
                      );
                    }}
                    placeholder="alto-do-parque"
                  />
                </Field>

                <Field label="Tagline" htmlFor="new-tagline" className="sm:col-span-2">
                  <Input
                    id="new-tagline"
                    variant="boxed"
                    value={form.tagline}
                    onChange={(event) => update("tagline", event.target.value)}
                    placeholder="Uma frase que resume o projeto"
                  />
                </Field>

                <Field
                  label="Descrição"
                  htmlFor="new-description"
                  className="sm:col-span-2"
                >
                  <Textarea
                    id="new-description"
                    variant="boxed"
                    value={form.description}
                    onChange={(event) => update("description", event.target.value)}
                    rows={4}
                    placeholder="Conte a história do empreendimento, o bairro e o que ele propõe."
                  />
                </Field>

                <Field label="Estágio" htmlFor="new-status">
                  <Select
                    id="new-status"
                    variant="boxed"
                    value={form.status}
                    onChange={(event) =>
                      update(
                        "status",
                        event.target.value as keyof typeof developmentStatusLabels,
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

                <Field label="Tipologia" htmlFor="new-type">
                  <Select
                    id="new-type"
                    variant="boxed"
                    value={form.type}
                    onChange={(event) =>
                      update(
                        "type",
                        event.target.value as keyof typeof developmentTypeLabels,
                      )
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
              <div className="border-b border-line px-4 py-3.5 sm:px-5">
                <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-accent">
                  02
                </p>
                <h2 className="mt-1 font-display text-lg text-ink">
                  Endereço e preço
                </h2>
              </div>
              <div className="grid gap-4 p-4 sm:grid-cols-6 sm:p-5">
                <Field label="Logradouro" htmlFor="new-street" className="sm:col-span-4">
                  <Input
                    id="new-street"
                    variant="boxed"
                    value={form.street}
                    onChange={(event) => update("street", event.target.value)}
                    placeholder="Rua, avenida..."
                  />
                </Field>
                <Field label="Número" htmlFor="new-number" className="sm:col-span-2">
                  <Input
                    id="new-number"
                    variant="boxed"
                    value={form.number}
                    onChange={(event) => update("number", event.target.value)}
                  />
                </Field>
                <Field
                  label="Bairro"
                  htmlFor="new-neighborhood"
                  className="sm:col-span-3"
                >
                  <Input
                    id="new-neighborhood"
                    variant="boxed"
                    value={form.neighborhood}
                    onChange={(event) => update("neighborhood", event.target.value)}
                  />
                </Field>
                <Field label="Cidade" htmlFor="new-city" className="sm:col-span-2">
                  <Input
                    id="new-city"
                    variant="boxed"
                    value={form.city}
                    onChange={(event) => update("city", event.target.value)}
                  />
                </Field>
                <Field label="UF" htmlFor="new-state" className="sm:col-span-1">
                  <Input
                    id="new-state"
                    variant="boxed"
                    value={form.state}
                    maxLength={2}
                    onChange={(event) =>
                      update("state", event.target.value.toUpperCase())
                    }
                  />
                </Field>
                <Field label="CEP" htmlFor="new-zip" className="sm:col-span-2">
                  <Input
                    id="new-zip"
                    variant="boxed"
                    value={form.zipCode}
                    onChange={(event) => update("zipCode", event.target.value)}
                  />
                </Field>
                <Field
                  label="Preço inicial (R$)"
                  htmlFor="new-price"
                  className="sm:col-span-2"
                  hint="Usado como base para gerar as unidades."
                >
                  <Input
                    id="new-price"
                    variant="boxed"
                    type="number"
                    min={0}
                    step={1000}
                    value={form.minPrice}
                    onChange={(event) => update("minPrice", event.target.value)}
                  />
                </Field>
              </div>
            </section>

            <div className="flex flex-wrap items-center justify-between gap-3 border border-line bg-paper-raised px-4 py-3">
              <Checkbox
                checked={form.published}
                onChange={(event) => update("published", event.target.checked)}
                label="Publicar imediatamente no diretório público"
              />
              {error && (
                <span className="text-[11px] text-accent-strong">{error}</span>
              )}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="border border-line bg-paper-raised p-4 lg:sticky lg:top-24">
              <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted/60">
                Prévia
              </p>
              <div className="relative mt-3 aspect-[4/3] overflow-hidden border border-line bg-paper-deep">
                <Image
                  src={form.coverImage}
                  alt="Capa"
                  fill
                  sizes="320px"
                  className="object-cover"
                />
              </div>
              <p className="mt-3 font-mono text-[8px] lowercase tracking-[0.06em] text-muted/60">
                {form.slug ? developmentHost(form.slug) : "slug pendente"}
              </p>
              <p className="mt-1 font-display text-xl leading-tight text-ink">
                {form.name || "Novo empreendimento"}
              </p>
              <p className="mt-1 line-clamp-2 text-[11.5px] leading-relaxed text-muted">
                {form.tagline || "A tagline aparece abaixo do nome."}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2 border-t border-line pt-3">
                <div>
                  <p className="font-mono text-[7px] uppercase tracking-[0.12em] text-muted/50">
                    A partir
                  </p>
                  <p className="mt-0.5 font-display text-base text-ink">
                    {Number(form.minPrice) > 0
                      ? `R$ ${new Intl.NumberFormat("pt-BR").format(
                          Number(form.minPrice),
                        )}`
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[7px] uppercase tracking-[0.12em] text-muted/50">
                    Unidades
                  </p>
                  <p className="mt-0.5 font-display text-base text-ink">
                    {formatNumber(40)}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <p className="font-mono text-[7.5px] uppercase tracking-[0.12em] text-muted/50">
                  Capa
                </p>
                <div className="mt-2 grid grid-cols-5 gap-1.5">
                  {COVERS.map((cover) => (
                    <button
                      key={cover.url}
                      type="button"
                      onClick={() => update("coverImage", cover.url)}
                      aria-label={cover.label}
                      className={
                        form.coverImage === cover.url
                          ? "relative aspect-square overflow-hidden border border-ink ring-1 ring-ink ring-offset-1 ring-offset-paper-raised"
                          : "relative aspect-square overflow-hidden border border-line opacity-70 transition-opacity hover:opacity-100"
                      }
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
              </div>

              <Button
                type="submit"
                variant="accent"
                size="lg"
                className="mt-5 w-full"
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
                ) : (
                  <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
                )}
                {saving ? "Criando" : "Criar empreendimento"}
              </Button>

              <p className="mt-3 flex items-start gap-1.5 font-mono text-[7px] uppercase leading-relaxed tracking-[0.1em] text-muted/40">
                <Sparkles className="mt-0.5 h-2.5 w-2.5 shrink-0" strokeWidth={1.5} />
                Modelo 3D procedural gerado com 10 andares e 4 unidades por
                andar
              </p>
            </div>

            <div className="border border-line bg-paper-raised p-4">
              <p className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.16em] text-muted/60">
                <Building2 className="h-3 w-3" strokeWidth={1.5} />
                Imobiliária
              </p>
              <p className="mt-2 font-display text-lg text-ink">{agency.name}</p>
              <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-muted">
                {agency.creci}
              </p>
            </div>
          </aside>
        </div>
      </form>
    </div>
  );
}

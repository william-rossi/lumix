"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Copy,
  Globe,
  Loader2,
  Save,
  ShieldCheck,
} from "lucide-react";
import type { Agency } from "@/models";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/field";
import { phoneMask } from "@/lib/format";

export function AgencySettingsForm({ agency }: { agency: Agency }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [notifications, setNotifications] = useState({
    newLead: true,
    weekly: true,
    product: false,
  });
  const [form, setForm] = useState({
    name: agency.name,
    creci: agency.creci,
    description: agency.description,
    phone: agency.phone,
    email: agency.email,
    website: agency.website ?? "",
    street: agency.address.street,
    number: agency.address.number,
    neighborhood: agency.address.neighborhood,
    city: agency.address.city,
    state: agency.address.state,
    zipCode: agency.address.zipCode,
  });

  const update = <Key extends keyof typeof form>(
    key: Key,
    value: (typeof form)[Key],
  ) => setForm((current) => ({ ...current, [key]: value }));

  const profileLink = `/imobiliarias/${agency.slug}`;

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    if (form.name.trim().length < 2) {
      setError("Informe o nome da imobiliária.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/agencies/${agency.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          creci: form.creci.trim(),
          description: form.description.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          website: form.website.trim() || undefined,
          address: {
            ...agency.address,
            street: form.street.trim(),
            number: form.number.trim(),
            neighborhood: form.neighborhood.trim(),
            city: form.city.trim(),
            state: form.state.trim().toUpperCase(),
            zipCode: form.zipCode.trim(),
            country: "Brasil",
          },
        }),
      });
      if (!response.ok) throw new Error("SAVE_FAILED");
      setNotice("Configurações da imobiliária salvas.");
      window.setTimeout(() => setNotice(null), 3500);
      router.refresh();
    } catch {
      setError("Não foi possível salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}${profileLink}`,
      );
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Não foi possível copiar o link.");
    }
  };

  return (
    <form onSubmit={save}>
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <section className="border border-line bg-paper-raised">
            <div className="border-b border-line px-4 py-3.5 sm:px-5">
              <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-accent">
                01
              </p>
              <h2 className="mt-1 font-display text-lg text-ink">
                Perfil público
              </h2>
              <p className="mt-0.5 text-[11px] text-muted">
                Como a imobiliária aparece no diretório e no rodapé de cada
                empreendimento.
              </p>
            </div>
            <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
              <Field label="Nome" htmlFor="agency-name" className="sm:col-span-2">
                <Input
                  id="agency-name"
                  variant="boxed"
                  value={form.name}
                  onChange={(event) => update("name", event.target.value)}
                />
              </Field>
              <Field label="CRECI" htmlFor="agency-creci">
                <Input
                  id="agency-creci"
                  variant="boxed"
                  value={form.creci}
                  onChange={(event) => update("creci", event.target.value)}
                />
              </Field>
              <Field
                label="Endereço do perfil"
                htmlFor="agency-slug"
                hint="Definido na criação da conta."
              >
                <Input
                  id="agency-slug"
                  variant="boxed"
                  value={profileLink}
                  readOnly
                  className="text-muted"
                />
              </Field>
              <Field
                label="Descrição"
                htmlFor="agency-description"
                className="sm:col-span-2"
              >
                <Textarea
                  id="agency-description"
                  variant="boxed"
                  value={form.description}
                  onChange={(event) => update("description", event.target.value)}
                  rows={4}
                />
              </Field>
            </div>
          </section>

          <section className="border border-line bg-paper-raised">
            <div className="border-b border-line px-4 py-3.5 sm:px-5">
              <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-accent">
                02
              </p>
              <h2 className="mt-1 font-display text-lg text-ink">Contato</h2>
              <p className="mt-0.5 text-[11px] text-muted">
                Canais exibidos no perfil e nos leads de cada projeto.
              </p>
            </div>
            <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
              <Field label="Telefone" htmlFor="agency-phone">
                <Input
                  id="agency-phone"
                  variant="boxed"
                  value={form.phone}
                  onChange={(event) =>
                    update("phone", phoneMask(event.target.value))
                  }
                />
              </Field>
              <Field label="E-mail" htmlFor="agency-email">
                <Input
                  id="agency-email"
                  variant="boxed"
                  type="email"
                  value={form.email}
                  onChange={(event) => update("email", event.target.value)}
                />
              </Field>
              <Field
                label="Site"
                htmlFor="agency-website"
                className="sm:col-span-2"
              >
                <Input
                  id="agency-website"
                  variant="boxed"
                  value={form.website}
                  onChange={(event) => update("website", event.target.value)}
                  placeholder="https://"
                />
              </Field>
            </div>
          </section>

          <section className="border border-line bg-paper-raised">
            <div className="border-b border-line px-4 py-3.5 sm:px-5">
              <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-accent">
                03
              </p>
              <h2 className="mt-1 font-display text-lg text-ink">Endereço</h2>
            </div>
            <div className="grid gap-4 p-4 sm:grid-cols-6 sm:p-5">
              <Field label="Logradouro" htmlFor="agency-street" className="sm:col-span-4">
                <Input
                  id="agency-street"
                  variant="boxed"
                  value={form.street}
                  onChange={(event) => update("street", event.target.value)}
                />
              </Field>
              <Field label="Número" htmlFor="agency-number" className="sm:col-span-2">
                <Input
                  id="agency-number"
                  variant="boxed"
                  value={form.number}
                  onChange={(event) => update("number", event.target.value)}
                />
              </Field>
              <Field label="Bairro" htmlFor="agency-neighborhood" className="sm:col-span-3">
                <Input
                  id="agency-neighborhood"
                  variant="boxed"
                  value={form.neighborhood}
                  onChange={(event) => update("neighborhood", event.target.value)}
                />
              </Field>
              <Field label="Cidade" htmlFor="agency-city" className="sm:col-span-2">
                <Input
                  id="agency-city"
                  variant="boxed"
                  value={form.city}
                  onChange={(event) => update("city", event.target.value)}
                />
              </Field>
              <Field label="UF" htmlFor="agency-state" className="sm:col-span-1">
                <Input
                  id="agency-state"
                  variant="boxed"
                  value={form.state}
                  maxLength={2}
                  onChange={(event) =>
                    update("state", event.target.value.toUpperCase())
                  }
                />
              </Field>
              <Field label="CEP" htmlFor="agency-zip" className="sm:col-span-2">
                <Input
                  id="agency-zip"
                  variant="boxed"
                  value={form.zipCode}
                  onChange={(event) => update("zipCode", event.target.value)}
                />
              </Field>
            </div>
          </section>

          <div className="sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-3 border border-line bg-paper-raised/95 px-4 py-3 backdrop-blur">
            <div>
              {notice ? (
                <p className="flex items-center gap-1.5 text-[11px] text-forest">
                  <Check className="h-3 w-3" strokeWidth={2} />
                  {notice}
                </p>
              ) : error ? (
                <p className="text-[11px] text-accent-strong">{error}</p>
              ) : (
                <p className="font-mono text-[7.5px] uppercase tracking-[0.12em] text-muted/50">
                  Alterações afetam todos os empreendimentos da conta
                </p>
              )}
            </div>
            <Button type="submit" variant="accent" size="md" disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
              ) : (
                <Save className="h-4 w-4" strokeWidth={1.75} />
              )}
              {saving ? "Salvando" : "Salvar configurações"}
            </Button>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="border border-line bg-paper-raised p-4">
            <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted/60">
              Domínio da plataforma
            </p>
            <p className="mt-2 break-all font-mono text-[10px] text-ink">
              lumix.com.br/imobiliarias/{agency.slug}
            </p>
            <button
              type="button"
              onClick={copyLink}
              className="mt-3 inline-flex h-8 w-full items-center justify-center gap-1.5 border border-line font-mono text-[7.5px] uppercase tracking-[0.12em] text-ink transition-colors hover:border-ink"
            >
              {copied ? (
                <Check className="h-3 w-3" strokeWidth={2} />
              ) : (
                <Copy className="h-3 w-3" strokeWidth={1.75} />
              )}
              {copied ? "Link copiado" : "Copiar link do perfil"}
            </button>
            <p className="mt-2 text-[10.5px] leading-relaxed text-muted">
              Cada empreendimento tem o próprio subdomínio, configurado em{" "}
              <span className="font-mono text-[9px]">proxy.ts</span>.
            </p>
          </div>

          <div className="border border-line bg-ink p-4 text-paper">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-paper/35">
                Plano
              </p>
              <span className="border border-paper/15 px-1.5 py-0.5 font-mono text-[7px] uppercase tracking-[0.12em] text-paper/60">
                demo
              </span>
            </div>
            <p className="mt-2 font-display text-xl text-paper">
              Estúdio · 2 projetos
            </p>
            <p className="mt-1 text-[10.5px] leading-relaxed text-paper/40">
              Inclui subdomínios, maquetes GLB no MongoDB e leads ilimitados
              nesta demonstração.
            </p>
            <div className="mt-4 border-t border-paper/10 pt-3">
              <div className="flex items-center justify-between font-mono text-[7.5px] uppercase tracking-[0.1em] text-paper/35">
                <span>Armazenamento 3D</span>
                <span>3,6 / 8 MB</span>
              </div>
              <div className="mt-1.5 h-1 w-full bg-paper/10">
                <div className="h-full w-[23%] bg-accent" />
              </div>
            </div>
          </div>

          <div className="border border-line bg-paper-raised p-4">
            <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted/60">
              Notificações
            </p>
            <div className="mt-3 space-y-2.5">
              <Checkbox
                checked={notifications.newLead}
                onChange={(event) =>
                  setNotifications((current) => ({
                    ...current,
                    newLead: event.target.checked,
                  }))
                }
                label="Novo lead por e-mail"
              />
              <Checkbox
                checked={notifications.weekly}
                onChange={(event) =>
                  setNotifications((current) => ({
                    ...current,
                    weekly: event.target.checked,
                  }))
                }
                label="Resumo semanal de desempenho"
              />
              <Checkbox
                checked={notifications.product}
                onChange={(event) =>
                  setNotifications((current) => ({
                    ...current,
                    product: event.target.checked,
                  }))
                }
                label="Novidades da plataforma"
              />
            </div>
            <p className="mt-3 border-t border-line pt-2 font-mono text-[7px] uppercase leading-relaxed tracking-[0.1em] text-muted/40">
              Preferências locais nesta demonstração
            </p>
          </div>

          <div className="border border-line bg-paper-raised p-4">
            <p className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.16em] text-muted/60">
              <ShieldCheck className="h-3 w-3" strokeWidth={1.5} />
              Integrações
            </p>
            <ul className="mt-3 space-y-2">
              <li className="flex items-center justify-between border-b border-line/70 pb-2 text-[11px] text-ink-soft">
                MongoDB
                <span className="font-mono text-[7px] uppercase tracking-[0.1em] text-forest">
                  opcional
                </span>
              </li>
              <li className="flex items-center justify-between border-b border-line/70 pb-2 text-[11px] text-ink-soft">
                GridFS · models
                <span className="font-mono text-[7px] uppercase tracking-[0.1em] text-forest">
                  pronto
                </span>
              </li>
              <li className="flex items-center justify-between text-[11px] text-ink-soft">
                GLTF/GLB
                <span className="flex items-center gap-1 font-mono text-[7px] uppercase tracking-[0.1em] text-forest">
                  <Globe className="h-2.5 w-2.5" strokeWidth={1.5} />
                  web
                </span>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </form>
  );
}

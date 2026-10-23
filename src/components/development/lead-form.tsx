"use client";

import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import type { Development } from "@/models";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { formatBRL, phoneMask, unitTypeLabels } from "@/lib/format";

interface FormState {
  name: string;
  email: string;
  phone: string;
  unitId: string;
  message: string;
  consent: boolean;
}

const initialState: FormState = {
  name: "",
  email: "",
  phone: "",
  unitId: "",
  message: "",
  consent: false,
};

export function LeadForm({ development }: { development: Development }) {
  const [form, setForm] = useState<FormState>(initialState);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">(
    "idle",
  );
  const [protocol, setProtocol] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const units = [...development.units].sort(
    (a, b) => a.pricing.basePrice - b.pricing.basePrice,
  );

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ unitId?: string }>).detail;
      if (detail?.unitId) {
        setForm((current) => ({ ...current, unitId: detail.unitId ?? "" }));
        setStatus("idle");
      }
    };
    window.addEventListener("lumix:interest", handler);
    return () => window.removeEventListener("lumix:interest", handler);
  }, []);

  const update = <Key extends keyof FormState>(key: Key, value: FormState[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "sending") return;

    if (!form.name || !form.email || !form.phone) {
      setError("Preencha nome, e-mail e telefone.");
      return;
    }
    if (form.phone.replace(/\D/g, "").length < 10) {
      setError("Informe um telefone válido com DDD.");
      return;
    }
    if (!form.consent) {
      setError("É necessário autorizar o contato da imobiliária.");
      return;
    }

    setError(null);
    setStatus("sending");

    try {
      const utm = Object.fromEntries(
        new URLSearchParams(window.location.search).entries(),
      );
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          developmentId: development.id,
          unitId: form.unitId || undefined,
          name: form.name,
          email: form.email,
          phone: form.phone,
          message: form.message,
          utm: {
            source: utm.utm_source,
            medium: utm.utm_medium,
            campaign: utm.utm_campaign,
          },
        }),
      });

      if (!response.ok) throw new Error("request failed");
      const data = (await response.json()) as { lead?: { id?: string } };
      setProtocol(data.lead?.id?.slice(-8).toUpperCase() ?? null);
      setStatus("success");
      setForm(initialState);
    } catch {
      setStatus("error");
      setError(
        "Não foi possível enviar agora. Tente novamente ou fale pelo WhatsApp.",
      );
    }
  };

  if (status === "success") {
    return (
      <div className="flex h-full flex-col justify-center border border-line bg-paper-raised p-7 md:p-9">
        <CheckCircle2 className="h-8 w-8 text-forest" strokeWidth={1.4} />
        <h3 className="mt-5 font-display text-3xl leading-tight text-ink">
          Recebemos o seu contato.
        </h3>
        <p className="mt-3 text-[13px] leading-relaxed text-muted">
          Um corretor da imobiliária vai responder em até um dia útil com os
          detalhes da unidade e as condições atualizadas.
        </p>
        {protocol && (
          <p className="mt-5 border-t border-line pt-4 font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
            Protocolo · {protocol}
          </p>
        )}
        <button
          type="button"
          onClick={() => {
            setStatus("idle");
            setProtocol(null);
          }}
          className="mt-6 self-start font-mono text-[9px] uppercase tracking-[0.16em] text-accent underline-offset-4 hover:underline"
        >
          Enviar outra mensagem
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="border border-line bg-paper-raised p-5 md:p-7"
      noValidate
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow text-accent">Atendimento direto</p>
          <h3 className="mt-2 font-display text-2xl leading-tight text-ink">
            Receba as condições desta unidade
          </h3>
        </div>
        <span className="hidden items-center gap-1.5 border border-line px-2 py-1 font-mono text-[8px] uppercase tracking-[0.12em] text-muted sm:flex">
          <ShieldCheck className="h-3 w-3" strokeWidth={1.5} />
          Dados protegidos
        </span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="Nome completo" htmlFor="lead-name">
          <Input
            id="lead-name"
            variant="boxed"
            value={form.name}
            onChange={(event) => update("name", event.target.value)}
            placeholder="Como podemos te chamar?"
            autoComplete="name"
            required
          />
        </Field>
        <Field label="E-mail" htmlFor="lead-email">
          <Input
            id="lead-email"
            type="email"
            variant="boxed"
            value={form.email}
            onChange={(event) => update("email", event.target.value)}
            placeholder="seu@email.com"
            autoComplete="email"
            required
          />
        </Field>
        <Field label="WhatsApp" htmlFor="lead-phone">
          <Input
            id="lead-phone"
            type="tel"
            variant="boxed"
            value={form.phone}
            onChange={(event) => update("phone", phoneMask(event.target.value))}
            placeholder="(11) 99999-9999"
            autoComplete="tel"
            required
          />
        </Field>
        <Field label="Unidade de interesse" htmlFor="lead-unit">
          <Select
            id="lead-unit"
            variant="boxed"
            value={form.unitId}
            onChange={(event) => update("unitId", event.target.value)}
          >
            <option value="">Qualquer unidade disponível</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.code} · {unitTypeLabels[unit.type]} ·{" "}
                {formatBRL(unit.pricing.basePrice)}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="mt-4">
        <Field label="Mensagem (opcional)" htmlFor="lead-message">
          <Textarea
            id="lead-message"
            variant="boxed"
            value={form.message}
            onChange={(event) => update("message", event.target.value)}
            placeholder="Conte o que é importante para você: prazo, financiamento, visita…"
          />
        </Field>
      </div>

      <div className="mt-4 hidden">
        <label htmlFor="lead-company">Empresa</label>
        <input id="lead-company" name="company" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="mt-5 flex flex-col gap-4 border-t border-line pt-4 sm:flex-row sm:items-start sm:justify-between">
        <Checkbox
          checked={form.consent}
          onChange={(event) => update("consent", event.target.checked)}
          label={
            <>
              Autorizo o contato da imobiliária por telefone, e-mail ou WhatsApp
              sobre este empreendimento, conforme a{" "}
              <a href="/privacidade" className="text-ink underline underline-offset-2">
                política de privacidade
              </a>
              .
            </>
          }
          className="max-w-md"
        />
        <Button
          type="submit"
          variant="accent"
          className="w-full shrink-0 sm:w-auto"
          disabled={status === "sending"}
        >
          {status === "sending" ? (
            <>
              Enviando
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
            </>
          ) : (
            <>
              Solicitar contato
              <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
            </>
          )}
        </Button>
      </div>

      {error && (
        <p className="mt-3 border border-accent/30 bg-accent-soft px-3 py-2 text-[11px] text-accent-strong">
          {error}
        </p>
      )}

      <p className="mt-3 text-[10px] leading-relaxed text-muted/60">
        Ao enviar, você concorda em receber comunicações sobre este
        empreendimento. A Lumix não comercializa imóveis e não cobra taxas de
        visitantes.
      </p>
    </form>
  );
}

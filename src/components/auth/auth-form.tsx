"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input } from "@/components/ui/field";
import { phoneMask } from "@/lib/format";

type Mode = "login" | "signup";

interface FormState {
  agencyName: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  consent: boolean;
}

const initialState: FormState = {
  agencyName: "",
  name: "",
  email: "",
  phone: "",
  password: "",
  consent: false,
};

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <Key extends keyof FormState>(
    key: Key,
    value: FormState[Key],
  ) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;

    if (mode === "signup" && form.agencyName.trim().length < 2) {
      setError("Informe o nome da imobiliária.");
      return;
    }
    if (mode === "signup" && form.name.trim().length < 2) {
      setError("Informe o seu nome.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("Informe um e-mail válido.");
      return;
    }
    if (form.password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (mode === "signup" && !form.consent) {
      setError("Aceite os termos para criar a conta.");
      return;
    }

    setError(null);
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 650));

    try {
      window.localStorage.setItem(
        "lumix:demo-session",
        JSON.stringify({
          email: form.email,
          name: form.name || form.agencyName || "Demonstração",
          mode,
        }),
      );
    } catch {
      /* storage is optional in demo mode */
    }

    router.push("/painel");
  };

  const fillDemo = () => {
    setForm((current) => ({
      ...current,
      email: "demo@lumix.com.br",
      password: "lumix123",
      name: current.name || "Marina Almeida",
      agencyName: current.agencyName || "Almeida Vasconcelos",
      phone: current.phone || "(11) 99812-4477",
      consent: true,
    }));
    setError(null);
  };

  return (
    <form onSubmit={submit} noValidate>
      <div className="space-y-4">
        {mode === "signup" && (
          <>
            <Field label="Imobiliária" htmlFor="auth-agency">
              <Input
                id="auth-agency"
                variant="boxed"
                value={form.agencyName}
                onChange={(event) => update("agencyName", event.target.value)}
                placeholder="Nome da sua imobiliária"
                autoComplete="organization"
                required
              />
            </Field>
            <Field label="Seu nome" htmlFor="auth-name">
              <Input
                id="auth-name"
                variant="boxed"
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                placeholder="Nome e sobrenome"
                autoComplete="name"
                required
              />
            </Field>
            <Field label="WhatsApp" htmlFor="auth-phone">
              <Input
                id="auth-phone"
                type="tel"
                variant="boxed"
                value={form.phone}
                onChange={(event) =>
                  update("phone", phoneMask(event.target.value))
                }
                placeholder="(11) 99999-9999"
                autoComplete="tel"
              />
            </Field>
          </>
        )}

        <Field label="E-mail profissional" htmlFor="auth-email">
          <Input
            id="auth-email"
            type="email"
            variant="boxed"
            value={form.email}
            onChange={(event) => update("email", event.target.value)}
            placeholder="voce@imobiliaria.com.br"
            autoComplete="email"
            required
          />
        </Field>

        <Field label="Senha" htmlFor="auth-password">
          <div className="relative">
            <Input
              id="auth-password"
              type={showPassword ? "text" : "password"}
              variant="boxed"
              value={form.password}
              onChange={(event) => update("password", event.target.value)}
              placeholder="Mínimo de 6 caracteres"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              className="pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-0 top-0 flex h-11 w-10 items-center justify-center text-muted transition-colors hover:text-ink"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" strokeWidth={1.5} />
              ) : (
                <Eye className="h-4 w-4" strokeWidth={1.5} />
              )}
            </button>
          </div>
        </Field>

        {mode === "signup" ? (
          <Checkbox
            checked={form.consent}
            onChange={(event) => update("consent", event.target.checked)}
            label={
              <>
                Concordo com os{" "}
                <Link href="/termos" className="text-ink underline underline-offset-2">
                  termos de uso
                </Link>{" "}
                e a{" "}
                <Link
                  href="/privacidade"
                  className="text-ink underline underline-offset-2"
                >
                  política de privacidade
                </Link>
                .
              </>
            }
          />
        ) : (
          <div className="flex items-center justify-between gap-3">
            <Checkbox
              checked={form.consent}
              onChange={(event) => update("consent", event.target.checked)}
              label="Manter conectado"
            />
            <a
              href="mailto:suporte@lumix.com.br?subject=Recuperar%20acesso"
              className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted underline-offset-4 hover:text-ink hover:underline"
            >
              Esqueci a senha
            </a>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-4 border border-accent/30 bg-accent-soft px-3 py-2 text-[11px] text-accent-strong">
          {error}
        </p>
      )}

      <Button
        type="submit"
        variant="accent"
        size="lg"
        className="mt-6 w-full"
        disabled={loading}
      >
        {loading ? (
          <>
            {mode === "login" ? "Entrando" : "Criando conta"}
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
          </>
        ) : (
          <>
            {mode === "login" ? "Entrar no painel" : "Criar conta"}
            <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
          </>
        )}
      </Button>

      <button
        type="button"
        onClick={fillDemo}
        className="mt-3 flex w-full items-center justify-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.16em] text-muted transition-colors hover:text-ink"
      >
        <Sparkles className="h-3 w-3" strokeWidth={1.5} />
        Preencher acesso de demonstração
      </button>

      <p className="mt-5 text-center font-mono text-[8px] uppercase leading-relaxed tracking-[0.12em] text-muted/50">
        Ambiente de demonstração · qualquer e-mail válido libera o painel
      </p>
    </form>
  );
}

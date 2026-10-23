import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = {
  title: "Criar conta da imobiliária",
  description:
    "Publique empreendimentos com maquete 3D, unidades e captura de leads em um subdomínio próprio.",
};

export default function SignupPage() {
  return (
    <AuthShell
      eyebrow="Nova imobiliária"
      title={
        <>
          Comece pelo
          <br />
          <span className="serif-italic text-accent">endereço.</span>
        </>
      }
      description="Crie a conta da sua imobiliária. O primeiro empreendimento pode ir ao ar hoje, com maquete 3D e unidades."
      footer={
        <>
          Já tem acesso?{" "}
          <Link
            href="/entrar"
            className="font-medium text-ink underline underline-offset-4"
          >
            Entrar no painel
          </Link>
        </>
      }
    >
      <AuthForm mode="signup" />
    </AuthShell>
  );
}

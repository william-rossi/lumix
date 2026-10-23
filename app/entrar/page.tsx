import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = {
  title: "Entrar no painel",
  description:
    "Acesse o painel da sua imobiliária para gerenciar empreendimentos, maquetes 3D e leads.",
};

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="Acesso da imobiliária"
      title={
        <>
          Bem-vindo
          <br />
          <span className="serif-italic text-accent">de volta.</span>
        </>
      }
      description="Entre para editar maquetes, unidades e acompanhar os contatos recebidos."
      footer={
        <>
          Ainda não tem conta?{" "}
          <Link
            href="/criar-conta"
            className="font-medium text-ink underline underline-offset-4"
          >
            Cadastre a sua imobiliária
          </Link>
        </>
      }
    >
      <AuthForm mode="login" />
    </AuthShell>
  );
}

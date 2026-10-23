import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Layers, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/ui/logo";

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}: {
  eyebrow: string;
  title: ReactNode;
  description: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-paper lg:grid lg:grid-cols-[0.9fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-stage text-paper lg:flex lg:flex-col lg:justify-between">
        <Image
          src="/examples/ap-5.avif"
          alt=""
          fill
          priority
          sizes="45vw"
          className="object-cover opacity-25 grayscale"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-stage/60 via-stage/80 to-stage" />

        <div className="relative z-10 flex items-center justify-between p-10">
          <Link href="/" aria-label="LUMIX — início">
            <Logo tone="paper" />
          </Link>
          <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-paper/35">
            Plataforma 3D
          </span>
        </div>

        <div className="relative z-10 px-10">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-accent">
            Painel da imobiliária
          </p>
          <p className="mt-6 max-w-md font-display text-[clamp(2.4rem,4vw,3.8rem)] leading-[0.98] tracking-[-0.025em] text-paper">
            A primeira visita
            <br />
            já <span className="serif-italic text-accent">aconteceu.</span>
          </p>
          <p className="mt-6 max-w-sm text-[12.5px] leading-relaxed text-paper/50">
            Publique maquetes 3D, gerencie unidades e acompanhe cada lead em um
            único lugar. O comprador decide antes de sair de casa.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-3 border-t border-paper/10 p-10">
          <div className="flex flex-col gap-2">
            <Layers className="h-4 w-4 text-paper/40" strokeWidth={1.5} />
            <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-paper/35">
              GLB no Mongo
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <ShieldCheck className="h-4 w-4 text-paper/40" strokeWidth={1.5} />
            <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-paper/35">
              Multi-tenant
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <ArrowUpRight className="h-4 w-4 text-paper/40" strokeWidth={1.5} />
            <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-paper/35">
              Subdomínio próprio
            </span>
          </div>
        </div>
      </aside>

      <main className="flex min-h-screen flex-col">
        <div className="flex h-16 items-center justify-between border-b border-line px-5 lg:hidden">
          <Link href="/" aria-label="LUMIX — início">
            <Logo />
          </Link>
          <Link
            href="/explorar"
            className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted"
          >
            Explorar
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 py-12 sm:px-8">
          <div className="w-full max-w-[400px]">
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-line-strong" />
              <span className="eyebrow text-muted">{eyebrow}</span>
            </div>

            <h1 className="mt-5 display-md text-ink">{title}</h1>
            <p className="mt-3 text-[13px] leading-relaxed text-muted">
              {description}
            </p>

            <div className="mt-8">{children}</div>

            <div className="mt-8 border-t border-line pt-5 text-center text-[12px] text-muted">
              {footer}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-line px-5 py-4 font-mono text-[8px] uppercase tracking-[0.14em] text-muted/50">
          <span>© Lumix</span>
          <div className="flex gap-4">
            <Link href="/privacidade" className="hover:text-ink">
              Privacidade
            </Link>
            <Link href="/termos" className="hover:text-ink">
              Termos
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

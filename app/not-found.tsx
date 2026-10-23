import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { buttonStyles } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Página não encontrada",
  description: "O endereço que você procurou não existe ou foi movido.",
};

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="border-b border-line">
          <div className="container-editorial grid gap-12 py-16 md:py-24 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:gap-20">
            <div>
              <div className="flex items-center gap-3">
                <span className="eyebrow text-accent">Erro 404</span>
                <span className="h-px w-10 bg-line-strong" />
                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted/60">
                  Endereço não encontrado
                </span>
              </div>
              <h1 className="display-xl mt-5 max-w-2xl font-display text-ink">
                Este endereço não existe{" "}
                <em className="serif-italic text-accent">ainda.</em>
              </h1>
              <p className="mt-6 max-w-lg text-[14.5px] leading-relaxed text-ink-soft">
                O empreendimento pode ter saído do ar, o link pode estar
                incompleto ou a página foi movida. Volte ao diretório para
                continuar a busca.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/explorar" className={buttonStyles({ size: "md" })}>
                  Explorar empreendimentos
                  <ArrowUpRight className="h-4 w-4" strokeWidth={1.75} />
                </Link>
                <Link
                  href="/"
                  className={buttonStyles({ size: "md", variant: "outline" })}
                >
                  <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
                  Voltar ao início
                </Link>
              </div>
            </div>

            <div className="border border-line bg-paper-raised p-6 md:p-8">
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted">
                O que você pode fazer
              </p>
              <ul className="mt-5 divide-y divide-line text-[13px] leading-relaxed text-ink-soft">
                <li className="flex gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="font-mono text-[9px] text-accent">01</span>
                  Confira se o endereço foi copiado por completo.
                </li>
                <li className="flex gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="font-mono text-[9px] text-accent">02</span>
                  Busque pelo nome do empreendimento no diretório.
                </li>
                <li className="flex gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="font-mono text-[9px] text-accent">03</span>
                  Fale com a imobiliária responsável pelo projeto.
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

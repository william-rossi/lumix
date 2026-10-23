import Link from "next/link";
import { ArrowUpRight, Mail } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-ink text-paper">
      <div className="container-editorial py-14 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Logo tone="paper" />
            <p className="mt-6 max-w-sm text-pretty text-[13px] leading-relaxed text-paper/55">
              A plataforma que transforma empreendimentos em experiências
              navegáveis. Menos PDF, mais decisão.
            </p>
            <div className="mt-8 flex items-center gap-3">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-paper/15 text-paper/60 transition-colors hover:border-paper hover:text-paper"
              >
                <span className="font-mono text-[9px] uppercase tracking-[0.08em]">
                  IG
                </span>
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-paper/15 text-paper/60 transition-colors hover:border-paper hover:text-paper"
              >
                <span className="font-mono text-[9px] uppercase tracking-[0.06em]">
                  in
                </span>
              </a>
              <a
                href="mailto:ola@lumix.com.br"
                aria-label="E-mail"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-paper/15 text-paper/60 transition-colors hover:border-paper hover:text-paper"
              >
                <Mail className="h-4 w-4" strokeWidth={1.5} />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 lg:col-span-4">
            <div>
              <p className="eyebrow text-paper/35">Plataforma</p>
              <ul className="mt-5 space-y-3 text-[13px] text-paper/65">
                <li>
                  <Link href="/explorar?tab=developments" className="hover:text-paper">
                    Empreendimentos
                  </Link>
                </li>
                <li>
                  <Link href="/explorar?tab=agencies" className="hover:text-paper">
                    Imobiliárias
                  </Link>
                </li>
                <li>
                  <Link href="/#como-funciona" className="hover:text-paper">
                    Como funciona
                  </Link>
                </li>
                <li>
                  <Link href="/criar-conta" className="hover:text-paper">
                    Para imobiliárias
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="eyebrow text-paper/35">Suporte</p>
              <ul className="mt-5 space-y-3 text-[13px] text-paper/65">
                <li>
                  <Link href="/entrar" className="hover:text-paper">
                    Acessar painel
                  </Link>
                </li>
                <li>
                  <a href="mailto:ola@lumix.com.br" className="hover:text-paper">
                    Falar com vendas
                  </a>
                </li>
                <li>
                  <a href="mailto:suporte@lumix.com.br" className="hover:text-paper">
                    Central de ajuda
                  </a>
                </li>
                <li>
                  <Link href="/sobre" className="hover:text-paper">
                    Sobre a Lumix
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="lg:col-span-3">
            <p className="eyebrow text-paper/35">Receba lançamentos</p>
            <p className="mt-5 text-[13px] leading-relaxed text-paper/55">
              Uma seleção mensal de empreendimentos com maquete 3D. Sem spam.
            </p>
            <form className="mt-5" action="#" method="post">
              <div className="flex items-center gap-2 border-b border-paper/20 pb-1">
                <Input
                  type="email"
                  name="email"
                  required
                  placeholder="seu@email.com"
                  aria-label="E-mail para newsletter"
                  className="border-0 text-paper placeholder:text-paper/35 focus:border-0"
                />
                <Button
                  type="submit"
                  size="sm"
                  variant="paper"
                  className="shrink-0 px-3"
                  aria-label="Assinar newsletter"
                >
                  <ArrowUpRight className="h-4 w-4" strokeWidth={1.75} />
                </Button>
              </div>
            </form>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-paper/10 pt-6 text-[10px] uppercase tracking-[0.18em] text-paper/30 md:flex-row md:items-center md:justify-between">
          <p>© Lumix Tecnologia Ltda.</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/privacidade" className="hover:text-paper/60">
              Privacidade
            </Link>
            <Link href="/termos" className="hover:text-paper/60">
              Termos
            </Link>
            <span>Feito para o mercado brasileiro</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

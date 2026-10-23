import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  Box,
  Compass,
  Layers,
  MapPin,
  Sparkles,
} from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { buttonStyles } from "@/components/ui/button";
import { agencies, developments } from "@/data/seed";
import { formatNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "Sobre a Lumix",
  description:
    "A Lumix transforma empreendimentos em experiências 3D navegáveis, conectando compradores e imobiliárias com informação clara.",
};

const principles = [
  {
    title: "Ver antes de imaginar",
    body: "Uma planta em PDF não mostra a luz do 12º andar, a posição da varanda ou a distância até o parque. A maquete interativa devolve escala e contexto à decisão.",
  },
  {
    title: "Menos atrito, mais conversa",
    body: "O comprador escolhe a unidade, vê o preço e envia o interesse no mesmo fluxo. A imobiliária recebe um lead com contexto — não um contato anônimo.",
  },
  {
    title: "A imobiliária no centro",
    body: "Cada projeto mantém a identidade da imobiliária, o CRECI e o atendimento. A Lumix é a infraestrutura da vitrine, não a corretora da história.",
  },
];

export default function AboutPage() {
  const allUnits = developments.flatMap((development) => development.units);
  const available = allUnits.filter((unit) => unit.status === "available").length;

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="border-b border-line">
          <div className="container-editorial grid gap-10 py-14 md:py-20 lg:grid-cols-[1.25fr_0.75fr] lg:items-end lg:gap-16">
            <div>
              <div className="flex items-center gap-3">
                <span className="eyebrow text-accent">Sobre a Lumix</span>
                <span className="h-px w-10 bg-line-strong" />
                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted/60">
                  Desde 2026
                </span>
              </div>
              <h1 className="display-xl mt-5 max-w-3xl font-display text-ink">
                A vitrine do mercado imobiliário{" "}
                <em className="serif-italic text-accent">mudou de escala.</em>
              </h1>
              <p className="mt-6 max-w-xl text-[14.5px] leading-relaxed text-ink-soft">
                A Lumix nasceu de uma constatação simples: comprar um imóvel na
                planta ainda depende de imaginar o que ninguém mostra. Construímos
                uma plataforma em que o empreendimento é navegável, cada unidade
                tem contexto e a conversa começa com informação.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/explorar" className={buttonStyles({ size: "md" })}>
                  Explorar empreendimentos
                  <ArrowUpRight className="h-4 w-4" strokeWidth={1.75} />
                </Link>
                <Link
                  href="/criar-conta"
                  className={buttonStyles({ size: "md", variant: "outline" })}
                >
                  Para imobiliárias
                </Link>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-px border border-line bg-line">
              {[
                ["Empreendimentos", formatNumber(developments.length)],
                ["Unidades mapeadas", formatNumber(allUnits.length)],
                ["Unidades livres", formatNumber(available)],
                ["Imobiliárias", formatNumber(agencies.length)],
              ].map(([label, value]) => (
                <div key={label} className="bg-paper px-5 py-6">
                  <dt className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted/60">
                    {label}
                  </dt>
                  <dd className="mt-2 font-display text-4xl leading-none text-ink">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="border-b border-line">
          <div className="container-editorial grid gap-10 py-14 md:py-20 lg:grid-cols-[0.6fr_1.4fr] lg:gap-16">
            <div>
              <p className="eyebrow text-muted/50">01 — Princípios</p>
              <h2 className="display-md mt-4 font-display text-ink">
                O que guia o produto.
              </h2>
            </div>
            <div className="divide-y divide-line border-t border-line">
              {principles.map((principle, index) => (
                <article
                  key={principle.title}
                  className="grid gap-3 py-6 sm:grid-cols-[40px_1fr] sm:gap-6"
                >
                  <span className="font-mono text-[9px] text-accent">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="font-display text-xl leading-tight text-ink">
                      {principle.title}
                    </h3>
                    <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-muted">
                      {principle.body}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-ink text-paper">
          <div className="container-editorial py-14 md:py-20">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
              <div>
                <p className="eyebrow text-paper/35">02 — Experiência</p>
                <h2 className="display-md mt-4 font-display text-paper">
                  Do primeiro clique ao{" "}
                  <em className="serif-italic text-accent-soft">corretor certo.</em>
                </h2>
                <p className="mt-5 max-w-sm text-[13px] leading-relaxed text-paper/50">
                  A jornada é curta de propósito. Nada de cadastro antes de ver,
                  nem de formulário sem unidade escolhida.
                </p>
              </div>
              <div className="grid gap-px border border-paper/10 bg-paper/10 sm:grid-cols-2">
                {[
                  {
                    icon: Compass,
                    title: "Descubra",
                    body: "Filtre por região, tipologia e estágio da obra. O diretório mostra o que está realmente disponível.",
                  },
                  {
                    icon: Box,
                    title: "Explore em 3D",
                    body: "Gire o edifício, percorra os andares e clique na unidade. Preço, metragem e fotos aparecem no mesmo painel.",
                  },
                  {
                    icon: Layers,
                    title: "Compare",
                    body: "Veja a posição solar, o andar e a planta de cada opção antes de falar com a imobiliária.",
                  },
                  {
                    icon: MapPin,
                    title: "Converse",
                    body: "Envie o interesse já vinculado à unidade. A imobiliária recebe um lead com contexto para responder melhor.",
                  },
                ].map((step) => (
                  <div key={step.title} className="bg-ink p-5">
                    <step.icon
                      className="h-5 w-5 text-accent-soft"
                      strokeWidth={1.25}
                    />
                    <h3 className="mt-4 font-display text-xl text-paper">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-[12px] leading-relaxed text-paper/45">
                      {step.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-line">
          <div className="container-editorial grid gap-10 py-14 md:py-20 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="eyebrow text-muted/50">03 — Para imobiliárias</p>
              <h2 className="display-md mt-4 font-display text-ink">
                Sua marca, seu domínio, seu atendimento.
              </h2>
              <p className="mt-5 max-w-lg text-[13.5px] leading-relaxed text-muted">
                Cada empreendimento ganha uma página pública com subdomínio
                próprio, maquete, galeria e captura de leads. O painel reúne
                portfólio, unidades e funil em um só lugar.
              </p>
              <ul className="mt-7 space-y-3 border-t border-line pt-6">
                {[
                  "Maquete GLB armazenada no MongoDB, com validação e limite de 8 MB.",
                  "Unidades editáveis com preço, status e tipologia em tempo real.",
                  "Leads vinculados à unidade de interesse e ao empreendimento.",
                  "Diretório público filtrável por região, tipologia e estágio.",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-[12.5px] leading-relaxed text-ink-soft"
                  >
                    <Sparkles
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent"
                      strokeWidth={1.5}
                    />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/criar-conta"
                className={buttonStyles({
                  size: "md",
                  variant: "accent",
                  className: "mt-8",
                })}
              >
                Criar conta de imobiliária
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.75} />
              </Link>
            </div>

            <div className="relative border border-line bg-paper-raised p-6">
              <div className="absolute inset-x-0 top-0 h-1 bg-accent" />
              <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted/50">
                Exemplo de mapeamento
              </p>
              <pre className="mt-4 overflow-x-auto font-mono text-[10px] leading-relaxed text-ink-soft">
{`{
  "developmentId": "dev_alto",
  "model": "/models/alto-do-parque.glb",
  "units": [
    {
      "unitId": "dev_alto_1202",
      "meshNames": ["A_1202", "A_1202_varanda"],
      "floorLevel": 12,
      "position": { "x": 4.2, "y": 37.2, "z": 0 }
    }
  ]
}`}
              </pre>
              <p className="mt-4 border-t border-line pt-3 text-[11px] leading-relaxed text-muted">
                O GLB guarda apenas geometria. O JSON separado conecta cada malha
                a uma unidade real — preço, fotos, andar e status mudam sem
                reexportar o modelo.
              </p>
            </div>
          </div>
        </section>

        <section>
          <div className="container-editorial py-14 md:py-20">
            <div className="flex flex-col items-start justify-between gap-6 border border-line bg-paper-raised p-6 md:flex-row md:items-center md:p-10">
              <div>
                <p className="eyebrow text-accent">Comece agora</p>
                <h2 className="display-md mt-3 max-w-lg font-display text-ink">
                  O próximo empreendimento pode ser navegável hoje.
                </h2>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/explorar" className={buttonStyles({ size: "md" })}>
                  Ver diretório
                  <ArrowUpRight className="h-4 w-4" strokeWidth={1.75} />
                </Link>
                <Link
                  href="/criar-conta"
                  className={buttonStyles({ size: "md", variant: "outline" })}
                >
                  Falar com vendas
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

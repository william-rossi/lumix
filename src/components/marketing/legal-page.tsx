import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";

export interface LegalSection {
  title: string;
  paragraphs: string[];
}

export function LegalPage({
  eyebrow,
  title,
  intro,
  updatedAt,
  sections,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  updatedAt: string;
  sections: LegalSection[];
}) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <header className="border-b border-line">
          <div className="container-editorial py-12 md:py-16">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted transition-colors hover:text-ink"
            >
              <ArrowLeft className="h-3 w-3" strokeWidth={1.5} />
              Voltar ao início
            </Link>
            <div className="mt-8 flex items-center gap-3">
              <span className="eyebrow text-accent">{eyebrow}</span>
              <span className="h-px w-10 bg-line-strong" />
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted/60">
                Atualizado em {updatedAt}
              </span>
            </div>
            <h1 className="display-lg mt-4 max-w-3xl font-display text-ink">
              {title}
            </h1>
            <p className="mt-5 max-w-2xl text-[14px] leading-relaxed text-ink-soft">
              {intro}
            </p>
          </div>
        </header>

        <div className="container-editorial grid gap-10 py-12 lg:grid-cols-[220px_1fr] lg:gap-16 lg:py-16">
          <nav className="lg:sticky lg:top-24 lg:self-start" aria-label="Seções">
            <p className="eyebrow text-muted/50">Nesta página</p>
            <ol className="mt-4 space-y-2">
              {sections.map((section, index) => (
                <li key={section.title}>
                  <a
                    href={`#sec-${index + 1}`}
                    className="group flex items-baseline gap-3 text-[11.5px] leading-snug text-muted transition-colors hover:text-ink"
                  >
                    <span className="font-mono text-[8px] text-muted/40 group-hover:text-accent">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="max-w-3xl">
            {sections.map((section, index) => (
              <section
                key={section.title}
                id={`sec-${index + 1}`}
                className="scroll-mt-24 border-t border-line py-8 first:border-t-0 first:pt-0"
              >
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-[9px] text-accent">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h2 className="font-display text-2xl leading-tight text-ink">
                    {section.title}
                  </h2>
                </div>
                <div className="mt-4 space-y-3 pl-7">
                  {section.paragraphs.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="text-[13px] leading-relaxed text-ink-soft"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}

            <div className="mt-8 border border-line bg-paper-raised p-5">
              <p className="eyebrow text-muted/50">Dúvidas</p>
              <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
                Fale com a gente em{" "}
                <a
                  href="mailto:privacidade@lumix.com.br"
                  className="text-ink underline decoration-line-strong underline-offset-2 hover:text-accent"
                >
                  privacidade@lumix.com.br
                </a>{" "}
                ou{" "}
                <a
                  href="mailto:juridico@lumix.com.br"
                  className="text-ink underline decoration-line-strong underline-offset-2 hover:text-accent"
                >
                  juridico@lumix.com.br
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

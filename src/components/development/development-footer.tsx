import Link from "next/link";
import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";
import type { Agency, Development } from "@/models";
import { BrandMark } from "@/components/ui/logo";
import { initials } from "@/lib/utils";

export function DevelopmentFooter({
  development,
  agency,
}: {
  development: Development;
  agency: Agency;
}) {
  return (
    <footer className="border-t border-stage-line bg-ink text-paper">
      <div className="container-editorial py-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center border border-paper/20 font-display text-sm text-paper">
                {initials(agency.name)}
              </span>
              <div>
                <p className="text-sm text-paper">{agency.name}</p>
                <p className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-paper/40">
                  {agency.creci}
                </p>
              </div>
            </div>
            <p className="mt-5 max-w-sm text-pretty text-[12px] leading-relaxed text-paper/50">
              {agency.description}
            </p>
            <Link
              href={`/imobiliarias/${agency.slug}`}
              className="mt-5 inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-paper/60 transition-colors hover:text-paper"
            >
              Ver perfil da imobiliária
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.5} />
            </Link>
          </div>

          <div className="lg:col-span-4">
            <p className="eyebrow text-paper/35">Contato</p>
            <ul className="mt-5 space-y-3 text-[12px] text-paper/65">
              <li>
                <a
                  href={`tel:${agency.phone.replace(/\s/g, "")}`}
                  className="flex items-center gap-2.5 transition-colors hover:text-paper"
                >
                  <Phone className="h-3.5 w-3.5 text-paper/35" strokeWidth={1.5} />
                  {agency.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${agency.email}`}
                  className="flex items-center gap-2.5 transition-colors hover:text-paper"
                >
                  <Mail className="h-3.5 w-3.5 text-paper/35" strokeWidth={1.5} />
                  {agency.email}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-paper/35"
                  strokeWidth={1.5}
                />
                <span>
                  {agency.address.street}, {agency.address.number}
                  <br />
                  {agency.address.neighborhood} · {agency.address.city} /{" "}
                  {agency.address.state}
                </span>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-3">
            <p className="eyebrow text-paper/35">Empreendimento</p>
            <p className="mt-5 font-display text-2xl leading-tight text-paper">
              {development.name}
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-paper/45">
              {development.address.street}, {development.address.number}
              <br />
              {development.address.neighborhood} · {development.address.city}
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <a
                href="#explorar"
                className="font-mono text-[9px] uppercase tracking-[0.14em] text-paper/55 transition-colors hover:text-paper"
              >
                Explorar unidades ↑
              </a>
              <a
                href="#contato"
                className="font-mono text-[9px] uppercase tracking-[0.14em] text-paper/55 transition-colors hover:text-paper"
              >
                Falar com corretor ↑
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-paper/10 pt-6 md:flex-row md:items-center md:justify-between">
          <p className="max-w-2xl text-[10px] leading-relaxed text-paper/30">
            Imagens de caráter ilustrativo. Valores, medidas e condições sujeitos
            a alteração sem aviso prévio. Consulte a imobiliária responsável e o
            memorial descritivo oficial.
          </p>
          <div className="flex shrink-0 flex-wrap items-center gap-x-5 gap-y-2">
            <span className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-paper/25">
              © {agency.name}
            </span>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 font-mono text-[8.5px] uppercase tracking-[0.14em] text-paper/40 transition-colors hover:text-paper"
            >
              <BrandMark className="h-3 w-auto text-accent" />
              Página publicada com Lumix
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

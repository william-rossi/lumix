"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { buttonStyles } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/explorar?tab=developments", label: "Empreendimentos" },
  { href: "/explorar?tab=agencies", label: "Imobiliárias" },
  { href: "/#como-funciona", label: "Como funciona" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/95 backdrop-blur-[2px]">
      <div className="container-editorial flex h-16 items-center justify-between gap-6">
        <Link href="/" aria-label="LUMIX — início">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Principal">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="link-underline text-[12.5px] text-ink-soft transition-colors hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <Link
            href="/entrar"
            className="text-[12.5px] text-muted transition-colors hover:text-ink"
          >
            Entrar
          </Link>
          <Link href="/criar-conta" className={buttonStyles({ size: "sm" })}>
            Para imobiliárias
            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.75} />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex h-10 w-10 items-center justify-center text-ink md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
        >
          {open ? (
            <X className="h-5 w-5" strokeWidth={1.5} />
          ) : (
            <Menu className="h-5 w-5" strokeWidth={1.5} />
          )}
        </button>
      </div>

      <div
        id="mobile-nav"
        className={cn(
          "overflow-hidden border-t border-line bg-paper transition-[max-height,opacity] duration-300 md:hidden",
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <nav className="container-editorial flex flex-col py-4" aria-label="Mobile">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="border-b border-line py-3 text-sm text-ink-soft"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/entrar"
            onClick={() => setOpen(false)}
            className="border-b border-line py-3 text-sm text-ink-soft"
          >
            Entrar
          </Link>
          <Link
            href="/criar-conta"
            onClick={() => setOpen(false)}
            className={buttonStyles({ size: "md", className: "mt-4 w-full" })}
          >
            Cadastrar imobiliária
            <ArrowUpRight className="h-4 w-4" strokeWidth={1.75} />
          </Link>
        </nav>
      </div>
    </header>
  );
}

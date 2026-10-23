import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-display-family",
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "LUMIX — Empreendimentos em 3D",
    template: "%s · LUMIX",
  },
  description:
    "A plataforma que conecta imobiliárias e compradores por meio de maquetes 3D interativas. Explore cada andar, unidade e acabamento antes de visitar.",
  metadataBase: new URL("https://lumix.com.br"),
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "LUMIX",
    title: "LUMIX — Empreendimentos em 3D",
    description:
      "Explore empreendimentos em 3D: andares, unidades, plantas e valores em uma única experiência.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink">
        {children}
      </body>
    </html>
  );
}

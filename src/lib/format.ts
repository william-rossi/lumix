import type {
  DevelopmentStatus,
  DevelopmentType,
  LeadSource,
  LeadStatus,
  Orientation,
  UnitStatus,
  UnitType,
} from "@/models";

const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const brlCentsFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("pt-BR");

export function formatBRL(cents: number, withCents = false) {
  const value = cents / 100;
  if (withCents) return brlCentsFormatter.format(value);
  if (value >= 1_000_000 && value % 1000 === 0) {
    return brlFormatter.format(value);
  }
  return brlFormatter.format(value);
}

export function formatCompactBRL(cents: number) {
  const value = cents / 100;
  if (value >= 1_000_000) {
    return `R$ ${new Intl.NumberFormat("pt-BR", {
      maximumFractionDigits: 1,
    }).format(value / 1_000_000)} mi`;
  }
  if (value >= 1_000) {
    return `R$ ${new Intl.NumberFormat("pt-BR", {
      maximumFractionDigits: 0,
    }).format(value / 1_000)} mil`;
  }
  return formatBRL(cents);
}

export function formatArea(value: number) {
  return `${new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
  }).format(value)} m²`;
}

export function formatNumber(value: number) {
  return numberFormatter.format(value);
}

export function formatPercent(value: number, digits = 0) {
  return `${new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: digits,
  }).format(value)}%`;
}

export function formatDate(
  value: Date | string,
  options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" },
) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("pt-BR", options).format(date);
}

export function formatMonthYear(value: Date | string) {
  return formatDate(value, { month: "long", year: "numeric" });
}

export const unitTypeLabels: Record<UnitType, string> = {
  studio: "Studio",
  "1_bedroom": "1 dormitório",
  "2_bedrooms": "2 dormitórios",
  "3_bedrooms": "3 dormitórios",
  "4_bedrooms": "4 dormitórios",
  penthouse: "Cobertura",
  garden: "Garden",
  commercial: "Comercial",
  custom: "Personalizado",
};

export const unitStatusLabels: Record<UnitStatus, string> = {
  available: "Disponível",
  reserved: "Reservada",
  sold: "Vendida",
  blocked: "Indisponível",
};

export const developmentStatusLabels: Record<DevelopmentStatus, string> = {
  launching: "Em lançamento",
  under_construction: "Em obras",
  ready: "Pronto para morar",
  sold_out: "Esgotado",
};

export const developmentTypeLabels: Record<DevelopmentType, string> = {
  residential: "Residencial",
  commercial: "Comercial",
  mixed: "Uso misto",
  land: "Terreno",
};

export const orientationLabels: Record<Orientation, string> = {
  north: "Norte",
  south: "Sul",
  east: "Leste",
  west: "Oeste",
  northeast: "Nordeste",
  northwest: "Noroeste",
  southeast: "Sudeste",
  southwest: "Sudoeste",
};

export const leadStatusLabels: Record<LeadStatus, string> = {
  new: "Novo",
  contacted: "Contatado",
  qualified: "Qualificado",
  visiting: "Em visita",
  proposal: "Proposta",
  closed_won: "Ganho",
  closed_lost: "Perdido",
};

export const leadSourceLabels: Record<LeadSource, string> = {
  website: "Site",
  portal: "Portal",
  social_media: "Redes sociais",
  referral: "Indicação",
  walk_in: "Presencial",
  event: "Evento",
};

export const leadStatusTone: Record<LeadStatus, string> = {
  new: "bg-accent-soft text-accent-strong",
  contacted: "bg-amber-soft text-amber",
  qualified: "bg-forest-soft text-forest",
  visiting: "bg-forest-soft text-forest",
  proposal: "bg-forest-soft text-forest",
  closed_won: "bg-ink text-paper",
  closed_lost: "bg-paper-deep text-muted",
};

export function statusTone(status: UnitStatus) {
  switch (status) {
    case "available":
      return {
        dot: "bg-forest",
        text: "text-forest",
        bg: "bg-forest-soft",
        border: "border-forest/25",
      };
    case "reserved":
      return {
        dot: "bg-amber",
        text: "text-amber",
        bg: "bg-amber-soft",
        border: "border-amber/25",
      };
    case "sold":
      return {
        dot: "bg-muted/60",
        text: "text-muted",
        bg: "bg-paper-deep",
        border: "border-line",
      };
    default:
      return {
        dot: "bg-muted",
        text: "text-muted",
        bg: "bg-paper-deep",
        border: "border-line",
      };
  }
}

export function phoneMask(value: string) {
  let digits = value.replace(/\D/g, "");
  let prefix = "";

  // Keep the Brazilian country code when the caller types an international
  // number. Without this, +55 11 99999-0000 would be truncated to "(55) …".
  if (digits.length > 11 && digits.startsWith("55")) {
    prefix = "+55 ";
    digits = digits.slice(2);
  }

  digits = digits.slice(0, 11);
  const local =
    digits.length <= 2
      ? digits
      : digits.length <= 6
        ? `(${digits.slice(0, 2)}) ${digits.slice(2)}`
        : digits.length <= 10
          ? `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
          : `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;

  return `${prefix}${local}`;
}

export function pricePerSqm(cents: number, area: number) {
  if (!area) return 0;
  return Math.round(cents / area);
}

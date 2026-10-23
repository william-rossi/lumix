import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function lerp(from: number, to: number, t: number) {
  return from + (to - from) * t;
}

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function initials(value: string) {
  return value
    .replace(/&/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function formatBytes(bytes: number, locale = "pt-BR") {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / Math.pow(1024, exponent);
  return `${new Intl.NumberFormat(locale, {
    maximumFractionDigits: value >= 100 ? 0 : 1,
  }).format(value)} ${units[exponent]}`;
}

export function truncate(value: string, max: number) {
  if (value.length <= max) return value;
  return `${value.slice(0, max).trimEnd()}…`;
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function developmentPath(slug: string) {
  const root = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  const useSubdomains = process.env.NEXT_PUBLIC_USE_SUBDOMAINS === "true";
  if (useSubdomains && root) {
    const protocol =
      process.env.NODE_ENV === "production" ? "https" : "http";
    return `${protocol}://${slug}.${root}`;
  }
  return `/sites/${slug}`;
}

export function developmentHost(slug: string) {
  const root = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "lumix.com.br";
  return `${slug}.${root}`;
}

export function copyToClipboard(value: string) {
  if (typeof navigator === "undefined") return Promise.resolve(false);
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard
      .writeText(value)
      .then(() => true)
      .catch(() => false);
  }
  return Promise.resolve(false);
}

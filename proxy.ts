import { NextResponse, type NextRequest } from "next/server";
import {
  getAgencyBySlug,
  getDevelopmentBySlug,
} from "@/lib/db/repository";

/**
 * Subdomain routing.
 *
 * alto-do-parque.lumix.com.br  →  /sites/alto-do-parque
 * alto-do-parque.localhost:3000 →  /sites/alto-do-parque  (local development)
 *
 * Reserved subdomains (app, painel, api, ...) are never rewritten.
 *
 * Public slug routes are also checked here. Dynamic pages render as a stream,
 * which means a `notFound()` thrown inside the page can no longer change the
 * HTTP status after the shell was sent. Validating the slug before rendering
 * keeps unknown developments and agencies returning a real 404.
 */

const ROOT_DOMAIN = (process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "lumix.com.br").toLowerCase();

const RESERVED = new Set([
  "www",
  "app",
  "api",
  "admin",
  "painel",
  "dashboard",
  "explorar",
  "empreendimentos",
  "imobiliarias",
  "entrar",
  "criar-conta",
  "sobre",
  "contato",
  "assets",
  "static",
  "cdn",
]);

function missingPage(request: NextRequest) {
  const target = request.nextUrl.clone();
  target.pathname = "/_not-found";
  target.search = "";
  return NextResponse.rewrite(target, { status: 404 });
}

function slugFromPath(pathname: string, prefix: string): string | null {
  const [segment, ...rest] = pathname.slice(prefix.length).split("/");
  if (!segment || rest.some(Boolean)) return null;
  try {
    return decodeURIComponent(segment);
  } catch {
    return null;
  }
}

async function publicSlugExists(pathname: string): Promise<boolean | null> {
  if (pathname.startsWith("/sites/")) {
    const slug = slugFromPath(pathname, "/sites/");
    return slug ? Boolean(await getDevelopmentBySlug(slug)) : false;
  }

  if (pathname.startsWith("/imobiliarias/")) {
    const slug = slugFromPath(pathname, "/imobiliarias/");
    return slug ? Boolean(await getAgencyBySlug(slug)) : false;
  }

  return null;
}

export async function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const host = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();

  if (!host) return NextResponse.next();

  if ((await publicSlugExists(url.pathname)) === false) {
    return missingPage(request);
  }

  let subdomain: string | null = null;

  if (host.endsWith(`.${ROOT_DOMAIN}`)) {
    subdomain = host.slice(0, -(ROOT_DOMAIN.length + 1));
  } else if (host.endsWith(".localhost")) {
    subdomain = host.slice(0, -".localhost".length);
  }

  // No subdomain, a reserved one, or a nested host — let the app handle it.
  if (!subdomain || RESERVED.has(subdomain) || subdomain.includes(".")) {
    return NextResponse.next();
  }

  if (url.pathname.startsWith("/sites/")) {
    return NextResponse.next();
  }

  if (!(await getDevelopmentBySlug(subdomain))) {
    return missingPage(request);
  }

  const suffix = url.pathname === "/" ? "" : url.pathname;
  url.pathname = `/sites/${subdomain}${suffix}`;

  const response = NextResponse.rewrite(url);
  response.headers.set("x-lumix-site", subdomain);
  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|examples|models|.*\\..*).*)",
  ],
};

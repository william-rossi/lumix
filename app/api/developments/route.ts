import { NextResponse } from "next/server";
import { createDevelopment, listDevelopments } from "@/lib/db/repository";
import { slugify } from "@/lib/utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const developments = await listDevelopments({
    city: searchParams.get("city") ?? undefined,
    state: searchParams.get("state") ?? undefined,
    type: searchParams.get("type") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    agencyId: searchParams.get("agencyId") ?? undefined,
    query: searchParams.get("q") ?? undefined,
    featured: searchParams.get("featured") === "true",
  });

  return NextResponse.json({ developments, total: developments.length });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (name.length < 3) {
    return NextResponse.json({ error: "INVALID_NAME" }, { status: 422 });
  }

  const slug =
    typeof body.slug === "string" && body.slug.length > 2
      ? slugify(body.slug)
      : slugify(name);

  const created = await createDevelopment({
    name,
    slug,
    tagline: typeof body.tagline === "string" ? body.tagline : undefined,
    description:
      typeof body.description === "string" ? body.description : undefined,
    agencyId: typeof body.agencyId === "string" ? body.agencyId : undefined,
    status:
      typeof body.status === "string"
        ? (body.status as never)
        : undefined,
    type: typeof body.type === "string" ? (body.type as never) : undefined,
    coverImage:
      typeof body.coverImage === "string" ? body.coverImage : undefined,
    address:
      body.address && typeof body.address === "object"
        ? (body.address as never)
        : undefined,
    pricing:
      body.pricing && typeof body.pricing === "object"
        ? (body.pricing as never)
        : undefined,
    model3d:
      body.model3d && typeof body.model3d === "object"
        ? (body.model3d as never)
        : undefined,
    isPublished: body.isPublished === true,
    highlights: Array.isArray(body.highlights)
      ? (body.highlights as string[])
      : undefined,
  });

  return NextResponse.json({ development: created }, { status: 201 });
}

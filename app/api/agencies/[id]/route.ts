import { NextResponse } from "next/server";
import { getAgencyById, updateAgency } from "@/lib/db/repository";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const agency = await getAgencyById(id);
  if (!agency) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  return NextResponse.json({ agency });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  if (typeof body.name === "string" && body.name.trim().length < 2) {
    return NextResponse.json({ error: "INVALID_NAME" }, { status: 422 });
  }

  const patch: Record<string, unknown> = {};
  for (const key of [
    "name",
    "description",
    "phone",
    "email",
    "website",
    "logo",
    "coverImage",
    "creci",
  ] as const) {
    if (typeof body[key] === "string") patch[key] = body[key];
  }
  if (body.address && typeof body.address === "object") {
    patch.address = body.address;
  }
  if (typeof body.isActive === "boolean") patch.isActive = body.isActive;

  const updated = await updateAgency(id, patch as never);
  if (!updated) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  return NextResponse.json({ agency: updated });
}

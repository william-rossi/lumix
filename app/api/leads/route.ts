import { NextResponse } from "next/server";
import { createLead, listLeads } from "@/lib/db/repository";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const developmentId = searchParams.get("developmentId") ?? undefined;
  const leads = await listLeads(developmentId);
  return NextResponse.json({ leads, total: leads.length });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  if (typeof body.company === "string" && body.company.length > 0) {
    // Honeypot filled by a bot — accept silently without persisting.
    return NextResponse.json({ lead: { id: "ignored" } }, { status: 201 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const developmentId =
    typeof body.developmentId === "string" ? body.developmentId : "";

  const errors: string[] = [];
  if (name.length < 3) errors.push("invalid-name");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("invalid-email");
  if (phone.replace(/\D/g, "").length < 10) errors.push("invalid-phone");
  if (!developmentId) errors.push("missing-development");

  if (errors.length > 0) {
    return NextResponse.json({ error: "VALIDATION", details: errors }, { status: 422 });
  }

  const lead = await createLead({
    developmentId,
    unitId: typeof body.unitId === "string" ? body.unitId : undefined,
    name,
    email,
    phone,
    message:
      typeof body.message === "string" && body.message.trim().length > 0
        ? body.message.trim()
        : undefined,
    source: "website",
    utm:
      body.utm && typeof body.utm === "object"
        ? (body.utm as Record<string, string>)
        : undefined,
  });

  return NextResponse.json({ lead }, { status: 201 });
}

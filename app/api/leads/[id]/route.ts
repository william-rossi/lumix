import { NextResponse } from "next/server";
import { updateLead } from "@/lib/db/repository";
import type { LeadStatus } from "@/models";

const STATUSES: LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "visiting",
  "proposal",
  "closed_won",
  "closed_lost",
];

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

  if (
    typeof body.status === "string" &&
    !STATUSES.includes(body.status as LeadStatus)
  ) {
    return NextResponse.json({ error: "INVALID_STATUS" }, { status: 422 });
  }

  const patch: Record<string, unknown> = {};
  if (typeof body.status === "string") patch.status = body.status;
  if (typeof body.assignedAgentId === "string") {
    patch.assignedAgentId = body.assignedAgentId;
  }
  if (typeof body.message === "string") patch.message = body.message;

  const lead = await updateLead(id, patch as never);
  if (!lead) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  return NextResponse.json({ lead });
}

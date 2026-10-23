import { connection, NextResponse } from "next/server";
import { listAgencies } from "@/lib/db/repository";

export async function GET() {
  await connection();
  const agencies = await listAgencies();
  return NextResponse.json({ agencies, total: agencies.length });
}

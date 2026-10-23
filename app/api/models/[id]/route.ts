import { NextResponse } from "next/server";
import { readModelFile } from "@/lib/db/repository";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const file = await readModelFile(id);
  if (!file) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return new NextResponse(Buffer.from(file.bytes), {
    headers: {
      "Content-Type": file.contentType,
      "Content-Disposition": `inline; filename="${file.fileName}"`,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

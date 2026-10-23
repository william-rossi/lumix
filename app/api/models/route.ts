import { NextResponse } from "next/server";
import { saveModelFile } from "@/lib/db/repository";
import { validateModelFile } from "@/lib/glb";

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "INVALID_FORM" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "MISSING_FILE" }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const validation = validateModelFile(file.name, file.size, bytes);

  if (!validation.ok) {
    return NextResponse.json(
      {
        error: "INVALID_MODEL",
        issues: validation.issues,
        report: validation.report ?? null,
      },
      { status: 422 },
    );
  }

  try {
    const stored = await saveModelFile(
      file.name,
      "model/gltf-binary",
      bytes,
    );
    return NextResponse.json(
      {
        model: stored,
        report: validation.report,
        issues: validation.issues,
        url: `/api/models/${stored.id}`,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "MODEL_TOO_LARGE") {
      return NextResponse.json({ error: "MODEL_TOO_LARGE" }, { status: 413 });
    }
    return NextResponse.json({ error: "UPLOAD_FAILED" }, { status: 500 });
  }
}

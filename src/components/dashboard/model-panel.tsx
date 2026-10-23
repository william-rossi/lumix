"use client";

import { useMemo, useRef, useState, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Check,
  Copy,
  Database,
  FileBox,
  Layers,
  Loader2,
  UploadCloud,
  X,
} from "lucide-react";
import type { Development } from "@/models";
import { Button } from "@/components/ui/button";
import {
  MODEL_MAX_BYTES,
  MODEL_RECOMMENDED_BYTES,
  suggestNodeMapping,
  validateModelFile,
  type GLBReport,
  type ValidationResult,
} from "@/lib/glb";
import { formatBytes, copyToClipboard, cn } from "@/lib/utils";

interface PendingFile {
  file: File;
  validation: ValidationResult;
}

export function ModelPanel({
  development,
  onSaved,
}: {
  development: Development;
  onSaved: (message: string) => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingFile | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const massing = development.model3d.massing;
  const storage = development.model3d.storage;

  const report: GLBReport | undefined = pending?.validation.report;
  const mapping = useMemo(
    () => (report ? suggestNodeMapping(report.nodeNames, development.units) : []),
    [report, development.units],
  );
  const matched = mapping.filter((item) => item.matched).length;

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setPending(null);

    if (file.size > MODEL_MAX_BYTES) {
      setError(
        `O arquivo tem ${formatBytes(file.size)} e excede o limite de ${formatBytes(
          MODEL_MAX_BYTES,
        )}.`,
      );
      return;
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const validation = validateModelFile(file.name, file.size, bytes);
    setPending({ file, validation });
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    void handleFile(event.dataTransfer.files?.[0]);
  };

  const upload = async () => {
    if (!pending || uploading) return;
    if (!pending.validation.ok) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", pending.file);
      const response = await fetch("/api/models", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json().catch(() => null)) as
        | {
            error?: string;
            url?: string;
            model?: { id: string; fileName: string; size: number; contentType: string };
          }
        | null;

      if (!response.ok || !data?.model || !data.url) {
        throw new Error(data?.error ?? "UPLOAD_FAILED");
      }

      const model3d = {
        ...development.model3d,
        url: data.url,
        format: "glb" as const,
        fileSize: data.model.size,
        storage: {
          provider: "mongodb-gridfs" as const,
          fileId: data.model.id,
          checksum: "",
          compressed: report?.compressed ?? false,
          compression: report?.compression,
          uploadedAt: new Date(),
        },
      };

      const patch = await fetch(`/api/developments/${development.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model3d }),
      });
      if (!patch.ok) throw new Error("ATTACH_FAILED");

      onSaved("Maquete enviada para o MongoDB e vinculada ao empreendimento.");
      setPending(null);
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    } catch (uploadError) {
      const message =
        uploadError instanceof Error && uploadError.message === "MODEL_TOO_LARGE"
          ? "Arquivo acima do limite de 8 MB."
          : "Não foi possível enviar a maquete. Tente novamente.";
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  const json = JSON.stringify(
    {
      developmentId: development.id,
      model: development.model3d.url,
      units: development.model3d.unitsMapping.slice(0, 3).map((item) => ({
        unitId: item.unitId,
        meshNames: item.meshNames,
        floorLevel: item.floorLevel,
        position: item.position,
      })),
      totalMappings: development.model3d.unitsMapping.length,
    },
    null,
    2,
  );

  const copyJson = async () => {
    await copyToClipboard(json);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-5 lg:col-span-2">
        <section className="border border-line bg-paper-raised">
          <div className="border-b border-line px-4 py-3.5 sm:px-5">
            <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-accent">
              01
            </p>
            <h2 className="mt-1 font-display text-lg text-ink">
              Arquivo da maquete
            </h2>
            <p className="mt-0.5 text-[11px] text-muted">
              GLTF/GLB apenas. O arquivo é validado no navegador antes de ir para
              o MongoDB.
            </p>
          </div>

          <div className="p-4 sm:p-5">
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={cn(
                "relative flex flex-col items-center justify-center border border-dashed px-5 py-10 text-center transition-colors",
                dragging
                  ? "border-accent bg-accent-soft/40"
                  : "border-line-strong bg-paper",
              )}
            >
              <span className="flex h-11 w-11 items-center justify-center border border-line bg-paper-raised">
                <UploadCloud
                  className="h-5 w-5 text-muted"
                  strokeWidth={1.25}
                />
              </span>
              <p className="mt-3 font-display text-lg text-ink">
                Arraste um .glb aqui
              </p>
              <p className="mt-1 max-w-sm text-[11px] leading-relaxed text-muted">
                Máximo de {formatBytes(MODEL_MAX_BYTES)} por arquivo.
                Recomendado: até {formatBytes(MODEL_RECOMMENDED_BYTES)} com Draco
                ou Meshopt.
              </p>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="mt-4 inline-flex h-8 items-center gap-1.5 border border-ink px-3 font-mono text-[8px] uppercase tracking-[0.14em] text-ink transition-colors hover:bg-ink hover:text-paper"
              >
                Escolher arquivo
              </button>
              <input
                ref={inputRef}
                type="file"
                accept=".glb,model/gltf-binary"
                className="sr-only"
                onChange={(event) => void handleFile(event.target.files?.[0])}
              />
            </div>

            {error && (
              <div className="mt-3 flex items-start gap-2 border border-accent/25 bg-accent-soft px-3 py-2.5 text-[11px] text-accent-strong">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                {error}
              </div>
            )}

            {pending && (
              <div className="mt-4 border border-line">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-paper px-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <FileBox className="h-4 w-4 shrink-0 text-muted" strokeWidth={1.5} />
                    <span className="truncate text-[12px] text-ink">
                      {pending.file.name}
                    </span>
                    <span className="shrink-0 font-mono text-[8px] uppercase tracking-[0.1em] text-muted/60">
                      {formatBytes(pending.file.size)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPending(null)}
                    className="text-muted transition-colors hover:text-ink"
                    aria-label="Remover arquivo"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </button>
                </div>

                {report && (
                  <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-4">
                    {[
                      ["Malhas", report.meshes],
                      ["Nós", report.nodes],
                      ["Materiais", report.materials],
                      ["Texturas", report.textures],
                    ].map(([label, value]) => (
                      <div key={String(label)} className="bg-paper-raised px-3 py-2.5">
                        <p className="font-mono text-[7.5px] uppercase tracking-[0.12em] text-muted/60">
                          {label}
                        </p>
                        <p className="mt-0.5 font-display text-lg text-ink">
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-1.5 px-3 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-1.5 py-0.5 font-mono text-[7px] uppercase tracking-[0.1em]",
                        report?.compressed
                          ? "bg-forest-soft text-forest"
                          : "bg-amber-soft text-amber",
                      )}
                    >
                      <Database className="h-2.5 w-2.5" strokeWidth={2} />
                      {report?.compressed
                        ? `Comprimido ${report.compression ?? ""}`
                        : "Sem compressão"}
                    </span>
                    <span className="font-mono text-[7.5px] uppercase tracking-[0.1em] text-muted/60">
                      glTF v{report?.version ?? "—"} · {report?.primitives ?? 0}{" "}
                      primitivas
                    </span>
                  </div>

                  {pending.validation.issues.map((issue) => (
                    <p
                      key={`${issue.code}-${issue.message}`}
                      className={cn(
                        "flex items-start gap-1.5 text-[10.5px] leading-relaxed",
                        issue.level === "error"
                          ? "text-accent-strong"
                          : "text-amber",
                      )}
                    >
                      <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" strokeWidth={1.75} />
                      {issue.message}
                    </p>
                  ))}
                  {pending.validation.issues.length === 0 && (
                    <p className="flex items-center gap-1.5 text-[10.5px] text-forest">
                      <Check className="h-3 w-3" strokeWidth={2} />
                      Arquivo válido, pronto para envio.
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-line px-3 py-2.5">
                  <span className="font-mono text-[7.5px] uppercase tracking-[0.12em] text-muted/60">
                    Upload → bucket models (GridFS)
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="accent"
                    onClick={upload}
                    disabled={uploading || !pending.validation.ok}
                  >
                    {uploading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.75} />
                    ) : (
                      <UploadCloud className="h-3.5 w-3.5" strokeWidth={1.75} />
                    )}
                    {uploading ? "Enviando" : "Enviar e vincular"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="border border-line bg-paper-raised">
          <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3.5 sm:px-5">
            <div>
              <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-accent">
                02
              </p>
              <h2 className="mt-1 font-display text-lg text-ink">
                Mapeamento de nós
              </h2>
              <p className="mt-0.5 text-[11px] text-muted">
                Relação entre as malhas do GLB e as unidades do JSON.
              </p>
            </div>
            {report && (
              <span className="shrink-0 border border-line px-2 py-1 font-mono text-[7.5px] uppercase tracking-[0.12em] text-muted">
                {matched}/{mapping.length} casados
              </span>
            )}
          </div>

          {report ? (
            <div className="max-h-72 overflow-auto">
              <table className="w-full min-w-[430px] text-left">
                <thead className="sticky top-0 bg-paper-raised">
                  <tr className="border-b border-line font-mono text-[7.5px] uppercase tracking-[0.12em] text-muted/50">
                    <th className="px-4 py-2 font-normal">Nó no GLB</th>
                    <th className="px-3 py-2 font-normal">Unidade</th>
                    <th className="px-4 py-2 text-right font-normal">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {mapping.slice(0, 10).map((row) => (
                    <tr key={row.unitId} className="border-b border-line/60 last:border-b-0">
                      <td className="max-w-52 truncate px-4 py-2 font-mono text-[10px] text-ink-soft">
                        {row.nodeName ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-[11px] text-ink">
                        {development.units.find((unit) => unit.id === row.unitId)?.name}{" "}
                        <span className="font-mono text-[8px] text-muted">
                          {row.code}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <span
                          className={cn(
                            "font-mono text-[7px] uppercase tracking-[0.1em]",
                            row.matched ? "text-forest" : "text-muted/50",
                          )}
                        >
                          {row.matched ? "mapeado" : "pendente"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-4 py-8 text-center sm:px-5">
              <p className="text-[11.5px] text-muted">
                Envie um GLB válido para ver os nós encontrados e as sugestões de
                mapeamento.
              </p>
              <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.12em] text-muted/40">
                Ex.: A_1202 → unidade 1202
              </p>
            </div>
          )}
        </section>
      </div>

      <aside className="space-y-4">
        <div className="border border-line bg-ink p-4 text-paper">
          <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-paper/35">
            Maquete ativa
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                storage ? "bg-forest-soft" : "bg-amber",
              )}
            />
            <span className="font-display text-lg text-paper">
              {storage ? "GLB no MongoDB" : "Procedural"}
            </span>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-paper/45">
            {storage
              ? "O visualizador usa a maquete enviada como referência de implantação. O mapeamento JSON define as unidades clicáveis."
              : "Sem GLB enviado, o visualizador gera uma massa procedural a partir dos andares e unidades cadastrados. O fluxo de upload está pronto para a versão final."}
          </p>

          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-paper/10 pt-3">
            <div>
              <dt className="font-mono text-[7px] uppercase tracking-[0.12em] text-paper/30">
                Andares
              </dt>
              <dd className="mt-0.5 font-display text-lg text-paper">
                {massing.floors}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[7px] uppercase tracking-[0.12em] text-paper/30">
                Unid. / andar
              </dt>
              <dd className="mt-0.5 font-display text-lg text-paper">
                {massing.unitsPerFloor}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[7px] uppercase tracking-[0.12em] text-paper/30">
                Altura
              </dt>
              <dd className="mt-0.5 font-display text-lg text-paper">
                {(massing.floors * massing.floorHeight).toFixed(1)} m
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[7px] uppercase tracking-[0.12em] text-paper/30">
                Arquivo
              </dt>
              <dd className="mt-0.5 font-display text-lg text-paper">
                {storage ? formatBytes(development.model3d.fileSize) : "—"}
              </dd>
            </div>
          </dl>

          {development.model3d.url && storage && (
            <p className="mt-3 truncate border border-paper/10 px-2 py-1.5 font-mono text-[7.5px] text-paper/40">
              {development.model3d.url}
            </p>
          )}
        </div>

        <div className="border border-line bg-paper-raised">
          <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
            <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted/60">
              JSON de unidades
            </p>
            <button
              type="button"
              onClick={copyJson}
              className="inline-flex items-center gap-1 font-mono text-[7.5px] uppercase tracking-[0.12em] text-muted transition-colors hover:text-ink"
            >
              {copied ? (
                <Check className="h-2.5 w-2.5" strokeWidth={2} />
              ) : (
                <Copy className="h-2.5 w-2.5" strokeWidth={2} />
              )}
              {copied ? "copiado" : "copiar"}
            </button>
          </div>
          <pre className="max-h-64 overflow-auto p-4 font-mono text-[9px] leading-relaxed text-ink-soft">
            {json}
          </pre>
        </div>

        <div className="border border-ink/10 bg-paper-deep/60 p-4">
          <p className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.16em] text-accent">
            <Layers className="h-3 w-3" strokeWidth={1.5} />
            Pipeline
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-ink-soft">
            GLB → validação no cliente → upload multipart → GridFS{" "}
            <span className="font-mono text-[10px]">models</span> (8 MB) →
            vínculo no documento do empreendimento.
          </p>
        </div>
      </aside>
    </div>
  );
}

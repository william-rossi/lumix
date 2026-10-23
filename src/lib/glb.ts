/**
 * Lightweight GLB inspector.
 *
 * Used by the dashboard uploader to validate a file BEFORE it reaches the
 * server and by the API route to re-validate the payload. It reads only the
 * JSON chunk (no BIN parsing), which is enough to count meshes, nodes and
 * materials and to estimate bounds from POSITION accessors.
 *
 * Runs on both browser and Node — no Buffer / fs usage.
 */

export const MODEL_MAX_BYTES = 8 * 1024 * 1024; // 8 MB hard cap
export const MODEL_RECOMMENDED_BYTES = 3 * 1024 * 1024;

const GLB_MAGIC = 0x46546c67; // "glTF"
const CHUNK_JSON = 0x4e4f534a;
const CHUNK_BIN = 0x004e4942;

export interface GLBBounds {
  min: { x: number; y: number; z: number };
  max: { x: number; y: number; z: number };
}

export interface GLBReport {
  version: number;
  generator?: string;
  fileSize: number;
  meshes: number;
  nodes: number;
  materials: number;
  textures: number;
  images: number;
  animations: number;
  accessors: number;
  primitives: number;
  nodeNames: string[];
  extensionsUsed: string[];
  extensionsRequired: string[];
  bounds?: GLBBounds;
  compressed: boolean;
  compression?: "draco" | "meshopt";
  hasBin: boolean;
}

export interface ValidationIssue {
  level: "error" | "warning";
  message: string;
  code: string;
}

export interface ValidationResult {
  ok: boolean;
  issues: ValidationIssue[];
  report?: GLBReport;
}

export function validateModelFile(
  fileName: string,
  fileSize: number,
  bytes: ArrayBuffer | Uint8Array,
): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!/\.glb$/i.test(fileName)) {
    issues.push({
      level: "error",
      code: "extension",
      message: "Envie um arquivo .glb (GLTF binário). .obj, .fbx e .gltf não são aceitos.",
    });
  }

  if (fileSize > MODEL_MAX_BYTES) {
    issues.push({
      level: "error",
      code: "too-large",
      message: "O arquivo excede o limite de 8 MB. Compacte com Draco ou reduza texturas.",
    });
  } else if (fileSize > MODEL_RECOMMENDED_BYTES) {
    issues.push({
      level: "warning",
      code: "heavy",
      message: "Acima de 3 MB. A experiência pode ficar lenta em conexões móveis.",
    });
  }

  const report = inspectGLB(bytes);

  if (!report) {
    issues.push({
      level: "error",
      code: "invalid-glb",
      message: "Arquivo GLB inválido ou corrompido. Verifique a exportação.",
    });
    return { ok: false, issues };
  }

  if (report.version !== 2) {
    issues.push({
      level: "error",
      code: "version",
      message: `GLB versão ${report.version} não suportada. Use glTF 2.0.`,
    });
  }

  if (report.meshes === 0) {
    issues.push({
      level: "error",
      code: "no-mesh",
      message: "Nenhuma malha (mesh) encontrada no arquivo.",
    });
  }

  if (report.textures > 12) {
    issues.push({
      level: "warning",
      code: "textures",
      message: `${report.textures} texturas detectadas. Considere atlas ou compressão KTX2.`,
    });
  }

  if (!report.compressed) {
    issues.push({
      level: "warning",
      code: "compression",
      message: "Sem Draco/Meshopt. A compressão reduz o arquivo em até 90%.",
    });
  }

  if (report.images > 6) {
    issues.push({
      level: "warning",
      code: "images",
      message: `${report.images} imagens embutidas. Prefira texturas compactadas.`,
    });
  }

  return {
    ok: !issues.some((issue) => issue.level === "error"),
    issues,
    report,
  };
}

export function inspectGLB(bytes: ArrayBuffer | Uint8Array): GLBReport | null {
  try {
    const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    if (view.byteLength < 20) return null;

    const dataView = new DataView(view.buffer, view.byteOffset, view.byteLength);
    if (dataView.getUint32(0, true) !== GLB_MAGIC) return null;

    const version = dataView.getUint32(4, true);
    const totalLength = dataView.getUint32(8, true);
    if (totalLength > view.byteLength) return null;

    let offset = 12;
    let json: Record<string, unknown> | null = null;
    let hasBin = false;

    while (offset + 8 <= view.byteLength) {
      const chunkLength = dataView.getUint32(offset, true);
      const chunkType = dataView.getUint32(offset + 4, true);
      const chunkStart = offset + 8;
      if (chunkStart + chunkLength > view.byteLength) break;

      if (chunkType === CHUNK_JSON) {
        const chunkBytes = view.subarray(chunkStart, chunkStart + chunkLength);
        const text = new TextDecoder().decode(chunkBytes).replace(/\u0000+$/g, "");
        json = JSON.parse(text) as Record<string, unknown>;
      } else if (chunkType === CHUNK_BIN) {
        hasBin = true;
      }

      offset = chunkStart + chunkLength;
    }

    if (!json) return null;

    const meshes = asArray(json.meshes);
    const nodes = asArray(json.nodes);
    const materials = asArray(json.materials);
    const textures = asArray(json.textures);
    const images = asArray(json.images);
    const animations = asArray(json.animations);
    const accessors = asArray(json.accessors);
    const extensionsUsed = asStringArray(json.extensionsUsed);
    const extensionsRequired = asStringArray(json.extensionsRequired);

    let primitives = 0;
    const bounds = computeBounds(meshes, accessors);
    for (const mesh of meshes) {
      primitives += asArray((mesh as Record<string, unknown>).primitives).length;
    }

    const asset = (json.asset ?? {}) as Record<string, unknown>;
    const compression = extensionsUsed.some((extension) =>
      extension.includes("KHR_draco_mesh_compression"),
    )
      ? "draco"
      : extensionsUsed.some((extension) =>
            extension.includes("EXT_meshopt_compression"),
          )
        ? "meshopt"
        : undefined;

    return {
      version: typeof asset.version === "string" ? Number.parseFloat(asset.version) || version : version,
      generator: typeof asset.generator === "string" ? asset.generator : undefined,
      fileSize: view.byteLength,
      meshes: meshes.length,
      nodes: nodes.length,
      materials: materials.length,
      textures: textures.length,
      images: images.length,
      animations: animations.length,
      accessors: accessors.length,
      primitives,
      nodeNames: nodes
        .map((node) => {
          const name = (node as Record<string, unknown>).name;
          return typeof name === "string" ? name : "";
        })
        .filter(Boolean)
        .slice(0, 400),
      extensionsUsed,
      extensionsRequired,
      bounds,
      compressed: Boolean(compression),
      compression,
      hasBin,
    };
  } catch {
    return null;
  }
}

function computeBounds(
  meshes: unknown[],
  accessors: unknown[],
): GLBBounds | undefined {
  const min = { x: Infinity, y: Infinity, z: Infinity };
  const max = { x: -Infinity, y: -Infinity, z: -Infinity };
  let found = false;

  for (const mesh of meshes) {
    for (const primitive of asArray((mesh as Record<string, unknown>).primitives)) {
      const attributes = ((primitive as Record<string, unknown>).attributes ??
        {}) as Record<string, unknown>;
      const positionIndex = attributes.POSITION;
      if (typeof positionIndex !== "number") continue;
      const accessor = accessors[positionIndex] as
        | { min?: number[]; max?: number[] }
        | undefined;
      if (!accessor?.min || !accessor?.max) continue;
      const [minX, minY, minZ] = accessor.min;
      const [maxX, maxY, maxZ] = accessor.max;
      if ([minX, minY, minZ, maxX, maxY, maxZ].some((value) => !Number.isFinite(value))) {
        continue;
      }
      min.x = Math.min(min.x, minX);
      min.y = Math.min(min.y, minY);
      min.z = Math.min(min.z, minZ);
      max.x = Math.max(max.x, maxX);
      max.y = Math.max(max.y, maxY);
      max.z = Math.max(max.z, maxZ);
      found = true;
    }
  }

  if (!found) return undefined;
  return { min, max };
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

/**
 * Suggests a mapping between GLB node names and unit codes.
 * Example: node "A_1203" or "unit-1203" is matched to unit code "1203".
 */
export function suggestNodeMapping(
  nodeNames: string[],
  units: Array<{ id: string; code: string; name?: string }>,
) {
  const normalized = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9]/g, "");

  return units.map((unit) => {
    const unitKey = normalized(unit.code);
    const match = nodeNames.find((name) => {
      const key = normalized(name);
      return key.includes(unitKey) || (unit.name ? key.includes(normalized(unit.name).slice(0, 12)) : false);
    });
    return {
      unitId: unit.id,
      code: unit.code,
      nodeName: match ?? null,
      matched: Boolean(match),
    };
  });
}

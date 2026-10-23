import type { Agency, Development, Lead, Unit } from "@/models";
import { ObjectId } from "mongodb";
import {
  collections,
  ensureIndexes,
  getModelBucket,
  getMongoDb,
  isMongoConfigured,
} from "@/lib/db/mongodb";
import * as memory from "@/lib/store";
import { MODEL_MAX_BYTES } from "@/lib/glb";

/**
 * Repository boundary.
 *
 * Every read/write goes through these functions. MongoDB is used when
 * MONGODB_URI exists; otherwise the shared file-backed demo store answers.
 * That keeps the UI identical in demo and production modes.
 */

function dbDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (typeof value === "string") return new Date(value);
  return undefined;
}

function hydrateDevelopment(doc: Record<string, unknown>): Development {
  return {
    ...(doc as unknown as Development),
    launchDate: dbDate(doc.launchDate),
    deliveryDate: dbDate(doc.deliveryDate),
    createdAt: dbDate(doc.createdAt) ?? new Date(),
    updatedAt: dbDate(doc.updatedAt) ?? new Date(),
  };
}

/* -------------------------------- Agencies ------------------------------- */

export async function listAgencies(): Promise<Agency[]> {
  const db = await getMongoDb();
  if (!db) return memory.listAgencies();
  const docs = await db
    .collection(collections.agencies)
    .find({ isActive: true })
    .sort({ name: 1 })
    .toArray();
  return docs as unknown as Agency[];
}

export async function getAgencyBySlug(slug: string): Promise<Agency | null> {
  const db = await getMongoDb();
  if (!db) {
    const agency = memory.findAgencyBySlug(slug);
    return agency?.isActive ? agency : null;
  }
  const doc = await db
    .collection(collections.agencies)
    .findOne({ slug, isActive: true });
  return (doc as unknown as Agency) ?? null;
}

export async function getAgencyById(id: string): Promise<Agency | null> {
  const db = await getMongoDb();
  if (!db) return memory.findAgency(id) ?? null;
  const doc = await db.collection(collections.agencies).findOne({ id });
  return (doc as unknown as Agency) ?? null;
}

export async function updateAgency(
  id: string,
  patch: Partial<Agency>,
): Promise<Agency | null> {
  const db = await getMongoDb();
  if (!db) return memory.updateAgency(id, patch);

  const rest = withoutImmutable(patch);
  const result = await db
    .collection(collections.agencies)
    .findOneAndUpdate(
      { id },
      { $set: { ...rest, updatedAt: new Date() } },
      { returnDocument: "after" },
    );
  return (result as unknown as Agency) ?? null;
}

/* ----------------------------- Developments ------------------------------ */

export interface DevelopmentQuery {
  city?: string;
  state?: string;
  type?: string;
  status?: string;
  agencyId?: string;
  featured?: boolean;
  includeDrafts?: boolean;
  query?: string;
}

export async function listDevelopments(
  filters: DevelopmentQuery = {},
): Promise<Development[]> {
  const db = await getMongoDb();
  if (!db) return memory.listDevelopments(filters);

  const query: Record<string, unknown> = filters.includeDrafts
    ? {}
    : { isPublished: true };
  if (filters.city) query["address.city"] = filters.city;
  if (filters.state) query["address.state"] = filters.state;
  if (filters.type) query.type = filters.type;
  if (filters.status) query.status = filters.status;
  if (filters.agencyId) query.agencyId = filters.agencyId;
  if (filters.featured) query.featured = true;
  if (filters.query) {
    query.$or = [
      { name: new RegExp(escapeRegex(filters.query), "i") },
      { "address.neighborhood": new RegExp(escapeRegex(filters.query), "i") },
      { "address.city": new RegExp(escapeRegex(filters.query), "i") },
    ];
  }

  const docs = await db
    .collection(collections.developments)
    .find(query)
    .sort({ featured: -1, "pricing.minPrice": 1 })
    .toArray();
  return docs.map((doc) => hydrateDevelopment(doc as Record<string, unknown>));
}

export async function getDevelopmentBySlug(
  slug: string,
): Promise<Development | null> {
  const db = await getMongoDb();
  if (!db) {
    const development = memory.findDevelopmentBySlug(slug);
    return development?.isPublished ? development : null;
  }
  const doc = await db
    .collection(collections.developments)
    .findOne({ slug, isPublished: true });
  return doc ? hydrateDevelopment(doc as Record<string, unknown>) : null;
}

export async function getDevelopmentById(
  id: string,
): Promise<Development | null> {
  const db = await getMongoDb();
  if (!db) return memory.findDevelopmentById(id) ?? null;
  const doc = await db.collection(collections.developments).findOne({ id });
  return doc ? hydrateDevelopment(doc as Record<string, unknown>) : null;
}

export async function createDevelopment(
  input: Partial<Development>,
): Promise<Development> {
  const db = await getMongoDb();
  if (!db) return memory.createDevelopment(input);
  await ensureIndexes();
  const created = memory.buildDevelopment(input);
  await db.collection(collections.developments).insertOne({ ...created });
  return created;
}

export async function updateDevelopment(
  id: string,
  patch: Partial<Development>,
): Promise<Development | null> {
  const db = await getMongoDb();
  if (!db) return memory.updateDevelopment(id, patch);

  const clean = sanitizePatch(patch);
  const result = await db.collection(collections.developments).findOneAndUpdate(
    { id },
    { $set: { ...clean, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  return result ? hydrateDevelopment(result as Record<string, unknown>) : null;
}

export async function deleteDevelopment(id: string): Promise<boolean> {
  const db = await getMongoDb();
  if (!db) return memory.deleteDevelopment(id);
  const result = await db.collection(collections.developments).deleteOne({ id });
  return result.deletedCount === 1;
}

/* --------------------------------- Units --------------------------------- */

export async function updateUnit(
  unitId: string,
  patch: Partial<Unit>,
): Promise<Unit | null> {
  const db = await getMongoDb();
  if (!db) return memory.updateUnit(unitId, patch);

  // Units are embedded in the development document for atomic reads.
  const development = await db.collection(collections.developments).findOne({
    "units.id": unitId,
  });
  if (!development) return null;
  const units = (development.units as Unit[]) ?? [];
  const index = units.findIndex((unit) => unit.id === unitId);
  if (index === -1) return null;
  const next = { ...units[index], ...patch, id: unitId };
  units[index] = next;
  await db.collection(collections.developments).updateOne(
    { id: development.id as string },
    { $set: { units, updatedAt: new Date() } },
  );
  return next;
}

export async function deleteUnit(unitId: string): Promise<boolean> {
  const db = await getMongoDb();
  if (!db) return memory.deleteUnit(unitId);

  const development = await db.collection(collections.developments).findOne({
    "units.id": unitId,
  });
  if (!development) return false;
  const units = ((development.units as Unit[]) ?? []).filter(
    (unit) => unit.id !== unitId,
  );
  const result = await db.collection(collections.developments).updateOne(
    { id: development.id as string },
    { $set: { units, updatedAt: new Date() } },
  );
  return result.modifiedCount === 1;
}

/* --------------------------------- Leads --------------------------------- */

export async function listLeads(developmentId?: string): Promise<Lead[]> {
  const db = await getMongoDb();
  if (!db) return memory.listLeads(developmentId);
  const query = developmentId ? { developmentId } : {};
  const docs = await db
    .collection(collections.leads)
    .find(query)
    .sort({ createdAt: -1 })
    .limit(200)
    .toArray();
  return docs as unknown as Lead[];
}

export async function createLead(input: Partial<Lead>): Promise<Lead> {
  const db = await getMongoDb();
  if (!db) return memory.createLead(input);

  const created: Lead = {
    id: `lead_${crypto.randomUUID().slice(0, 8)}`,
    developmentId: input.developmentId ?? "",
    unitId: input.unitId,
    name: input.name ?? "",
    email: input.email ?? "",
    phone: input.phone ?? "",
    message: input.message,
    source: input.source ?? "website",
    status: "new",
    utm: input.utm,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await db.collection(collections.leads).insertOne({ ...created });
  return created;
}

export async function updateLead(
  id: string,
  patch: Partial<Lead>,
): Promise<Lead | null> {
  const db = await getMongoDb();
  if (!db) return memory.updateLead(id, patch);

  const rest = withoutImmutable(patch);
  const result = await db
    .collection(collections.leads)
    .findOneAndUpdate(
      { id },
      { $set: { ...rest, updatedAt: new Date() } },
      { returnDocument: "after" },
    );
  return (result as unknown as Lead) ?? null;
}

/* ------------------------------ 3D Models -------------------------------- */

export interface StoredModel {
  id: string;
  fileName: string;
  contentType: string;
  size: number;
  uploadedAt: Date;
}

export async function saveModelFile(
  fileName: string,
  contentType: string,
  bytes: Uint8Array,
): Promise<StoredModel> {
  if (bytes.byteLength > MODEL_MAX_BYTES) {
    throw new Error("MODEL_TOO_LARGE");
  }

  const bucket = await getModelBucket();
  if (!bucket) {
    const id = memory.saveModel(fileName, contentType, bytes);
    return {
      id,
      fileName,
      contentType,
      size: bytes.byteLength,
      uploadedAt: new Date(),
    };
  }

  await ensureIndexes();
  const upload = bucket.openUploadStream(fileName, {
    metadata: { size: bytes.byteLength, contentType },
  });
  await new Promise<void>((resolve, reject) => {
    upload.on("error", reject);
    upload.on("finish", () => resolve());
    upload.end(Buffer.from(bytes));
  });
  const gridFsId = String(upload.id);
  const id = gridFsId;
  const db = await getMongoDb();
  await db?.collection(collections.models).insertOne({
    id,
    fileName,
    contentType,
    size: bytes.byteLength,
    gridFsId,
    createdAt: new Date(),
  });
  return { id, fileName, contentType, size: bytes.byteLength, uploadedAt: new Date() };
}

export async function readModelFile(
  id: string,
): Promise<{ bytes: Uint8Array; contentType: string; fileName: string } | null> {
  const db = await getMongoDb();
  if (!db) {
    const memoryModel = memory.getModel(id);
    if (!memoryModel) return null;
    return {
      bytes: memoryModel.bytes,
      contentType: memoryModel.contentType,
      fileName: memoryModel.fileName,
    };
  }

  const meta = await db.collection(collections.models).findOne({ id });
  if (!meta) return null;
  const bucket = await getModelBucket();
  if (!bucket) return null;
  const chunks: Uint8Array[] = [];
  const gridFsId = typeof meta.gridFsId === "string" ? meta.gridFsId : null;
  await new Promise<void>((resolve, reject) => {
    const stream = gridFsId
      ? bucket.openDownloadStream(new ObjectId(gridFsId))
      : bucket.openDownloadStreamByName(meta.fileName as string);
    stream.on("data", (chunk: Buffer) => chunks.push(new Uint8Array(chunk)));
    stream.on("error", reject);
    stream.on("end", () => resolve());
  });
  const total = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return {
    bytes: merged,
    contentType: (meta.contentType as string) ?? "model/gltf-binary",
    fileName: (meta.fileName as string) ?? `${id}.glb`,
  };
}

/* -------------------------------- Helpers -------------------------------- */

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function withoutImmutable<T extends { id?: string; createdAt?: Date }>(
  patch: T,
): T {
  const copy = { ...patch };
  delete copy.id;
  delete copy.createdAt;
  return copy;
}

function sanitizePatch(patch: Partial<Development>) {
  return withoutImmutable(patch);
}

export { isMongoConfigured };

import { Buffer } from "node:buffer";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { Agency, Development, Lead, Unit } from "@/models";
import { agencies as seedAgencies, developments as seedDevelopments, leads as seedLeads } from "@/data/seed";
import { computeUnitSlots, unitHeight } from "@/lib/massing";

/**
 * Server-side demo store.
 *
 * Acts as a stand-in for MongoDB while the app runs without credentials. The
 * repository layer talks to this store, so CRUD is functional without a
 * database. Next renders pages and route handlers in separate server contexts,
 * so the state is persisted to a small JSON file instead of living on
 * globalThis. That keeps writes made through the API visible to pages, and
 * also survives a dev-server restart.
 *
 * When MONGODB_URI is present the repository layer prefers MongoDB instead.
 */

interface StoredModelMeta {
  fileName: string;
  contentType: string;
  createdAt: Date;
}

interface LumixStore {
  agencies: Agency[];
  developments: Development[];
  leads: Lead[];
  models: Map<string, StoredModelMeta>;
}

interface PersistedModel extends Omit<StoredModelMeta, "createdAt"> {
  id: string;
  createdAt: string;
}

interface PersistedStore {
  version: 1;
  agencies: Agency[];
  developments: Development[];
  leads: Lead[];
  models: PersistedModel[];
}

const storeFile =
  process.env.LUMIX_STORE_FILE?.trim() ||
  join(process.cwd(), ".data", "lumix-store.json");
const modelsDir = join(dirname(storeFile), "models");

const dateKeys = new Set([
  "createdAt",
  "updatedAt",
  "launchDate",
  "deliveryDate",
  "uploadedAt",
  "publishedAt",
  "dueDate",
  "validUntil",
]);

function clone<T>(value: T): T {
  return structuredClone(value);
}

function createSeedStore(): LumixStore {
  return {
    agencies: clone(seedAgencies),
    developments: clone(seedDevelopments),
    leads: clone(seedLeads),
    models: new Map(),
  };
}

function reviveDates<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => reviveDates(item)) as T;
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        dateKeys.has(key) &&
        typeof item === "string" &&
        !Number.isNaN(Date.parse(item))
          ? new Date(item)
          : reviveDates(item),
      ]),
    ) as T;
  }
  return value;
}

function readStoreFile(): LumixStore | null {
  try {
    const parsed = JSON.parse(
      readFileSync(/* turbopackIgnore: true */ storeFile, "utf8"),
    ) as PersistedStore;
    if (
      !parsed ||
      !Array.isArray(parsed.agencies) ||
      !Array.isArray(parsed.developments) ||
      !Array.isArray(parsed.leads)
    ) {
      return null;
    }
    return {
      agencies: reviveDates(parsed.agencies),
      developments: reviveDates(parsed.developments),
      leads: reviveDates(parsed.leads),
      models: new Map(
        (parsed.models ?? []).map((model) => [
          model.id,
          {
            fileName: model.fileName,
            contentType: model.contentType,
            createdAt: new Date(model.createdAt),
          },
        ]),
      ),
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      console.warn("[lumix] Could not read the demo store:", error);
    }
    return null;
  }
}

function writeStoreFile(store: LumixStore): void {
  try {
    mkdirSync(dirname(storeFile), { recursive: true });
    const payload: PersistedStore = {
      version: 1,
      agencies: store.agencies,
      developments: store.developments,
      leads: store.leads,
      models: [...store.models].map(([id, model]) => ({
        id,
        fileName: model.fileName,
        contentType: model.contentType,
        createdAt: model.createdAt.toISOString(),
      })),
    };
    const temporary = `${storeFile}.${process.pid}.${crypto.randomUUID().slice(0, 6)}.tmp`;
    writeFileSync(/* turbopackIgnore: true */ temporary, JSON.stringify(payload), "utf8");
    renameSync(/* turbopackIgnore: true */ temporary, storeFile);
  } catch (error) {
    console.warn("[lumix] Could not persist the demo store:", error);
  }
}

function modelFile(id: string): string {
  return join(modelsDir, id);
}

export function getStore(): LumixStore {
  const persisted = readStoreFile();
  if (persisted) return persisted;

  const seeded = createSeedStore();
  writeStoreFile(seeded);
  return seeded;
}

function mutateStore<T>(mutator: (store: LumixStore) => T): T {
  const store = readStoreFile() ?? createSeedStore();
  const result = mutator(store);
  writeStoreFile(store);
  return result;
}

export function resetStore() {
  const store = createSeedStore();
  writeStoreFile(store);
  return store;
}

/* ------------------------------- Agencies -------------------------------- */

export function listAgencies() {
  return getStore().agencies.filter((agency) => agency.isActive);
}

export function findAgency(id: string) {
  return getStore().agencies.find((agency) => agency.id === id);
}

export function findAgencyBySlug(slug: string) {
  return getStore().agencies.find((agency) => agency.slug === slug);
}

export function updateAgency(
  id: string,
  patch: Partial<Agency>,
): Agency | null {
  return mutateStore((store) => {
    const agency = store.agencies.find((item) => item.id === id);
    if (!agency) return null;
    Object.assign(agency, patch, { id, updatedAt: new Date() });
    return agency;
  });
}

/* ----------------------------- Developments ------------------------------ */

export interface DevelopmentFilters {
  city?: string;
  state?: string;
  type?: string;
  status?: string;
  query?: string;
  agencyId?: string;
  featured?: boolean;
  includeDrafts?: boolean;
}

export function listDevelopments(filters: DevelopmentFilters = {}) {
  return getStore().developments.filter((development) => {
    if (!filters.includeDrafts && !development.isPublished) return false;
    if (filters.agencyId && development.agencyId !== filters.agencyId) return false;
    if (filters.city && development.address.city !== filters.city) return false;
    if (filters.state && development.address.state !== filters.state) return false;
    if (filters.type && development.type !== filters.type) return false;
    if (filters.status && development.status !== filters.status) return false;
    if (filters.featured && !development.featured) return false;
    if (filters.query) {
      const haystack = [
        development.name,
        development.address.neighborhood,
        development.address.city,
        development.tagline ?? "",
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(filters.query.toLowerCase())) return false;
    }
    return true;
  });
}

export function findDevelopmentBySlug(slug: string) {
  return getStore().developments.find((development) => development.slug === slug);
}

export function findDevelopmentById(id: string) {
  return getStore().developments.find((development) => development.id === id);
}

export function buildDevelopment(
  input: Partial<Development>,
  fallbackAgencyId = "agency_demo",
): Development {
  const id = input.id ?? `dev_${crypto.randomUUID().slice(0, 8)}`;
  const slug = input.slug ?? id;
  const floors = input.model3d?.massing?.floors ?? 10;
  const unitsPerFloor = input.model3d?.massing?.unitsPerFloor ?? 4;
  const floorHeight = input.model3d?.massing?.floorHeight ?? 3.1;
  const towerWidth = input.model3d?.massing?.towerWidth ?? 18;
  const towerDepth = input.model3d?.massing?.towerDepth ?? 16;
  const basePrice = input.pricing?.minPrice ?? 900_000_00;

  const units =
    input.units ?? generateDefaultUnits(id, floors, unitsPerFloor, basePrice);

  const development: Development = {
    id,
    agencyId: input.agencyId ?? fallbackAgencyId,
    name: input.name ?? "Novo empreendimento",
    slug,
    description: input.description ?? "",
    tagline: input.tagline,
    address:
      input.address ?? {
        street: "",
        number: "",
        neighborhood: "",
        city: "São Paulo",
        state: "SP",
        zipCode: "",
        country: "Brasil",
      },
    status: input.status ?? "launching",
    type: input.type ?? "residential",
    launchDate: input.launchDate,
    deliveryDate: input.deliveryDate,
    coverImage: input.coverImage ?? "/examples/ap-1.jpg",
    gallery: input.gallery ?? [],
    model3d:
      input.model3d ??
      buildModel3d(`${id}_model`, units, {
        floors,
        unitsPerFloor,
        towerWidth,
        towerDepth,
        floorHeight,
      }),
    units,
    amenities: input.amenities ?? [],
    specifications: input.specifications ?? [],
    pricing: input.pricing ?? {
      minPrice: basePrice,
      maxPrice: basePrice,
      currency: "BRL",
      pricePerSqmRange: { min: 0, max: 0 },
    },
    highlights: input.highlights ?? [],
    createdAt: new Date(),
    updatedAt: new Date(),
    isPublished: input.isPublished ?? false,
    featured: input.featured ?? false,
    seo: input.seo ?? {
      title: input.name ?? "Empreendimento",
      description: input.tagline ?? "",
      keywords: [],
    },
  };

  return development;
}

export function createDevelopment(input: Partial<Development>): Development {
  return mutateStore((store) => {
    const development = buildDevelopment(input, store.agencies[0]?.id);
    store.developments.unshift(development);
    return development;
  });
}

export function updateDevelopment(
  id: string,
  patch: Partial<Development>,
): Development | null {
  return mutateStore((store) => {
    const index = store.developments.findIndex(
      (development) => development.id === id,
    );
    if (index === -1) return null;
    const updated = {
      ...store.developments[index],
      ...patch,
      id,
      updatedAt: new Date(),
    };
    store.developments[index] = updated;
    return updated;
  });
}

export function deleteDevelopment(id: string) {
  return mutateStore((store) => {
    const index = store.developments.findIndex(
      (development) => development.id === id,
    );
    if (index === -1) return false;
    store.developments.splice(index, 1);
    return true;
  });
}

/* --------------------------------- Units --------------------------------- */

export function findUnit(unitId: string) {
  for (const development of getStore().developments) {
    const unit = development.units.find((item) => item.id === unitId);
    if (unit) return { development, unit };
  }
  return null;
}

export function updateUnit(unitId: string, patch: Partial<Unit>): Unit | null {
  return mutateStore((store) => {
    for (const development of store.developments) {
      const unit = development.units.find((item) => item.id === unitId);
      if (!unit) continue;
      Object.assign(unit, patch);
      if (patch.pricing) {
        unit.pricing = { ...unit.pricing, ...patch.pricing };
      }
      development.updatedAt = new Date();
      return unit;
    }
    return null;
  });
}

export function addUnit(developmentId: string, input: Partial<Unit>): Unit | null {
  return mutateStore((store) => {
    const development = store.developments.find(
      (item) => item.id === developmentId,
    );
    if (!development) return null;
    const floor = input.floor ?? 1;
    const code = input.code ?? `${floor}${String(development.units.filter((unit) => unit.floor === floor).length + 1).padStart(2, "0")}`;
    const unit: Unit = {
      id: input.id ?? `${developmentId}_${code}_${crypto.randomUUID().slice(0, 4)}`,
      developmentId,
      code,
      name: input.name ?? "Nova unidade",
      floor,
      type: input.type ?? "2_bedrooms",
      status: input.status ?? "available",
      area: input.area ?? { private: 70, common: 9, total: 76 },
      rooms:
        input.rooms ?? {
          bedrooms: 2,
          suites: 1,
          bathrooms: 2,
          halfBathrooms: 0,
          parkingSpaces: 1,
          hasBalcony: true,
          hasGarden: false,
          hasStorage: true,
        },
      pricing:
        input.pricing ?? {
          basePrice: development.pricing.minPrice,
          pricePerSqm: 0,
        },
      orientation: input.orientation ?? "east",
      images: input.images ?? [],
      features: input.features ?? [],
      description: input.description,
      sortOrder: development.units.length,
    };
    development.units.push(unit);
    development.updatedAt = new Date();
    return unit;
  });
}

export function deleteUnit(unitId: string) {
  return mutateStore((store) => {
    for (const development of store.developments) {
      const unit = development.units.find((item) => item.id === unitId);
      if (!unit) continue;
      development.units = development.units.filter(
        (item) => item.id !== unit.id,
      );
      development.updatedAt = new Date();
      return true;
    }
    return false;
  });
}

/* --------------------------------- Leads --------------------------------- */

export function listLeads(developmentId?: string) {
  const leads = getStore().leads;
  return developmentId
    ? leads.filter((lead) => lead.developmentId === developmentId)
    : leads;
}

export function createLead(input: Partial<Lead>): Lead {
  return mutateStore((store) => {
    const lead: Lead = {
      id: `lead_${crypto.randomUUID().slice(0, 8)}`,
      developmentId: input.developmentId ?? "",
      unitId: input.unitId,
      name: input.name ?? "",
      email: input.email ?? "",
      phone: input.phone ?? "",
      message: input.message,
      source: input.source ?? "website",
      status: "new",
      assignedAgentId: undefined,
      utm: input.utm,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    store.leads.unshift(lead);
    return lead;
  });
}

export function updateLead(id: string, patch: Partial<Lead>): Lead | null {
  return mutateStore((store) => {
    const lead = store.leads.find((item) => item.id === id);
    if (!lead) return null;
    Object.assign(lead, patch, { id, updatedAt: new Date() });
    return lead;
  });
}

/* --------------------------------- Models -------------------------------- */

export function saveModel(
  fileName: string,
  contentType: string,
  bytes: Uint8Array,
) {
  const id = `model_${crypto.randomUUID().slice(0, 10)}`;
  try {
    mkdirSync(modelsDir, { recursive: true });
    writeFileSync(/* turbopackIgnore: true */ modelFile(id), Buffer.from(bytes));
  } catch (error) {
    console.warn("[lumix] Could not persist the model file:", error);
  }

  mutateStore((store) => {
    store.models.set(id, {
      fileName,
      contentType,
      createdAt: new Date(),
    });
  });

  return id;
}

export function getModel(id: string) {
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) return null;
  const model = getStore().models.get(id);
  if (!model) return null;
  try {
    return {
      ...model,
      bytes: new Uint8Array(readFileSync(/* turbopackIgnore: true */ modelFile(id))),
    };
  } catch (error) {
    console.warn("[lumix] Could not read the model file:", error);
    return null;
  }
}

/* -------------------------------- Helpers -------------------------------- */

export function generateDefaultUnits(
  developmentId: string,
  floors: number,
  unitsPerFloor: number,
  basePrice: number,
): Unit[] {
  const units: Unit[] = [];
  let sortOrder = 0;
  for (let floor = 1; floor <= floors; floor += 1) {
    for (let index = 0; index < unitsPerFloor; index += 1) {
      const code = `${floor}${String(index + 1).padStart(2, "0")}`;
      const area = 68 + index * 8;
      const price = Math.round(basePrice * (1 + (floor - 1) * 0.009) * (1 + index * 0.07));
      units.push({
        id: `${developmentId}_${code}`,
        developmentId,
        code,
        name: "Apartamento",
        floor,
        type: index === 0 ? "1_bedroom" : "2_bedrooms",
        status: "available",
        area: { private: area, common: Math.round(area * 0.14), total: area + 6 },
        rooms: {
          bedrooms: index === 0 ? 1 : 2,
          suites: index === 0 ? 0 : 1,
          bathrooms: 2,
          halfBathrooms: 0,
          parkingSpaces: 1,
          hasBalcony: true,
          hasGarden: false,
          hasStorage: true,
        },
        pricing: {
          basePrice: price,
          pricePerSqm: Math.round(price / (area + 6)),
          iptuEstimate: Math.round(area * 135),
          condoFeeEstimate: Math.round(area * 1150),
          paymentPlan: { downPayment: 20, installments: 36, correctionIndex: "INCC" },
        },
        orientation: "east",
        images: [],
        features: [],
        sortOrder: sortOrder++,
      });
    }
  }
  return units;
}

export function buildModel3d(
  id: string,
  units: Unit[],
  massing: {
    floors: number;
    unitsPerFloor: number;
    towerWidth: number;
    towerDepth: number;
    floorHeight: number;
  },
): Development["model3d"] {
  const byFloor = new Map<number, Unit[]>();
  for (const unit of units) {
    const list = byFloor.get(unit.floor) ?? [];
    list.push(unit);
    byFloor.set(unit.floor, list);
  }

  const height = massing.floors * massing.floorHeight;
  return {
    id,
    url: `/models/${id}.glb`,
    format: "glb",
    version: "1.0.0",
    fileSize: 0,
    bounds: {
      min: { x: -massing.towerWidth / 2, y: 0, z: -massing.towerDepth / 2 },
      max: { x: massing.towerWidth / 2, y: height, z: massing.towerDepth / 2 },
    },
    unitsMapping: units.map((unit) => {
      const floorUnits = (byFloor.get(unit.floor) ?? []).sort(
        (a, b) => a.sortOrder - b.sortOrder,
      );
      const index = floorUnits.findIndex((item) => item.id === unit.id);
      const slots = computeUnitSlots(
        floorUnits.length,
        massing.towerWidth,
        massing.towerDepth,
      );
      const slot = slots[index] ?? slots[0];
      return {
        unitId: unit.id,
        meshNames: [`unit-${unit.id}`],
        floorLevel: unit.floor,
        position: {
          x: Number(slot.x.toFixed(2)),
          y: Number(unitHeight(unit.floor, massing.floorHeight).toFixed(2)),
          z: Number(slot.z.toFixed(2)),
        },
      };
    }),
    cameraPresets: [
      {
        id: "overview",
        name: "Vista geral",
        position: {
          x: massing.towerWidth * 1.7,
          y: height * 0.82,
          z: massing.towerDepth * 2.1,
        },
        target: { x: 0, y: height * 0.42, z: 0 },
        fov: 34,
      },
    ],
    lightingPreset: {
      ambientIntensity: 0.55,
      directionalLights: [
        { position: { x: 14, y: 22, z: 10 }, intensity: 2.1, color: "#fff3df" },
      ],
    },
    materials: [],
    massing: { mode: "procedural", ...massing },
  };
}

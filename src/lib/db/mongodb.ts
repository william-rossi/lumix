import { MongoClient, GridFSBucket, type Db } from "mongodb";

/**
 * MongoDB connection (singleton per process).
 *
 * The app runs without a database by default — the file-backed demo store
 * keeps the demo fully interactive. Set MONGODB_URI to enable persistence.
 */

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB ?? "lumix";

const globalWithMongo = globalThis as typeof globalThis & {
  __lumixMongoClient?: Promise<MongoClient>;
  __lumixIndexesReady?: Promise<void>;
};

export function isMongoConfigured() {
  return Boolean(uri);
}

export async function getMongoDb(): Promise<Db | null> {
  if (!uri) return null;
  if (!globalWithMongo.__lumixMongoClient) {
    globalWithMongo.__lumixMongoClient = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    }).connect();
  }
  const client = await globalWithMongo.__lumixMongoClient;
  return client.db(dbName);
}

export const collections = {
  agencies: "agencies",
  developments: "developments",
  units: "units",
  leads: "leads",
  models: "model_assets",
} as const;

export async function getModelBucket(): Promise<GridFSBucket | null> {
  const db = await getMongoDb();
  if (!db) return null;
  return new GridFSBucket(db, { bucketName: "models" });
}

export async function ensureIndexes() {
  if (!isMongoConfigured()) return;
  if (!globalWithMongo.__lumixIndexesReady) {
    globalWithMongo.__lumixIndexesReady = (async () => {
      const db = await getMongoDb();
      if (!db) return;
      await Promise.all([
        db.collection(collections.agencies).createIndex({ slug: 1 }, { unique: true }),
        db
          .collection(collections.developments)
          .createIndex({ slug: 1 }, { unique: true }),
        db
          .collection(collections.developments)
          .createIndex({ agencyId: 1, isPublished: 1 }),
        db
          .collection(collections.developments)
          .createIndex({ "address.city": 1, "address.state": 1 }),
        db.collection(collections.units).createIndex({ developmentId: 1 }),
        db.collection(collections.units).createIndex({ developmentId: 1, code: 1 }),
        db.collection(collections.leads).createIndex({ developmentId: 1, createdAt: -1 }),
        db.collection(collections.models).createIndex({ checksum: 1 }),
      ]);
    })().catch(() => {
      globalWithMongo.__lumixIndexesReady = undefined;
    });
  }
  await globalWithMongo.__lumixIndexesReady;
}

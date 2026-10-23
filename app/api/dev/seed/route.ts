import { NextResponse } from "next/server";
import {
  collections,
  ensureIndexes,
  getMongoDb,
  isMongoConfigured,
} from "@/lib/db/mongodb";
import { agencies, developments, leads } from "@/data/seed";

/**
 * One-off demo seed for a real MongoDB instance.
 *
 * The app runs from the file-backed demo store by default. When MONGODB_URI is
 * set the database starts empty, so the demo content must be inserted once:
 *
 *   LUMIX_ALLOW_SEED=true npm run dev
 *   curl -X POST http://localhost:3000/api/dev/seed
 *
 * The route is disabled unless LUMIX_ALLOW_SEED is exactly "true".
 */
export async function POST() {
  if (!isMongoConfigured()) {
    return NextResponse.json(
      { error: "MONGODB_NOT_CONFIGURED" },
      { status: 400 },
    );
  }
  if (process.env.LUMIX_ALLOW_SEED !== "true") {
    return NextResponse.json({ error: "SEED_DISABLED" }, { status: 403 });
  }

  const db = await getMongoDb();
  if (!db) {
    return NextResponse.json(
      { error: "MONGODB_UNAVAILABLE" },
      { status: 503 },
    );
  }

  await ensureIndexes();

  const existing = await db
    .collection(collections.developments)
    .countDocuments();
  if (existing > 0) {
    return NextResponse.json({
      skipped: true,
      reason: "developments already exist",
      developments: existing,
    });
  }

  await db.collection(collections.agencies).insertMany(agencies);
  await db.collection(collections.developments).insertMany(developments);
  await db.collection(collections.leads).insertMany(leads);

  return NextResponse.json({
    seeded: true,
    agencies: agencies.length,
    developments: developments.length,
    units: developments.reduce(
      (total, development) => total + development.units.length,
      0,
    ),
    leads: leads.length,
  });
}

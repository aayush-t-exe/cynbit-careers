import "server-only";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Production uses Neon Postgres over HTTP (DATABASE_URL). Local development falls
// back to PGlite, a real Postgres compiled to WASM that stores data in .data/,
// so the project runs with zero setup. Both speak the same SQL and schema.
export type Db = NeonHttpDatabase<typeof schema>;

let dbPromise: Promise<Db> | undefined;

async function connect(): Promise<Db> {
  const url = process.env.DATABASE_URL;

  if (url) {
    const { neon } = await import("@neondatabase/serverless");
    const { drizzle } = await import("drizzle-orm/neon-http");
    const client = neon(url);
    for (const statement of splitStatements(schema.bootstrapSql)) {
      await client.query(statement);
    }
    return drizzle(client, { schema });
  }

  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { mkdirSync } = await import("node:fs");
  const dir = process.env.PGLITE_DIR ?? ".data/pglite";
  mkdirSync(dir, { recursive: true });
  const client = new PGlite(dir);
  await client.exec(schema.bootstrapSql);
  return drizzle(client, { schema }) as unknown as Db;
}

function splitStatements(sqlText: string) {
  return sqlText
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
}

export function getDb() {
  dbPromise ??= connect().catch((error) => {
    dbPromise = undefined;
    throw error;
  });
  return dbPromise;
}

export { schema };

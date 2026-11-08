import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export * from "./schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set. Add it to .env.local or the environment before running the app.");
}

const sql = neon(databaseUrl);

export const db = drizzle(sql, { schema });

export async function checkDatabaseConnection() {
  const result = await sql`SELECT 1 AS ok`;
  return Array.isArray(result) ? result[0] : result;
}

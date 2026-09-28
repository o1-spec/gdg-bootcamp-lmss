import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { validateServerEnv } from "./env";

// Validate critical env vars at module load time.
// Throws in production if DATABASE_URL / JWT secrets are missing.
validateServerEnv();

const globalForPrisma = globalThis as unknown as {
  pool?: Pool;
  prisma?: PrismaClient;
};

const pool =
  globalForPrisma.pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    // Conservative pool sizing for Supabase PgBouncer + Vercel serverless.
    // PgBouncer handles multiplexing on the database side; the app only needs
    // a small local pool per serverless instance. Each Vercel function instance
    // is short-lived, so we cap aggressively to avoid exhausting the 60-connection
    // Supabase transaction-mode PgBouncer limit across concurrent invocations.
    max: 5,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
  });

const adapter = new PrismaPg(pool);

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.pool = pool;
  globalForPrisma.prisma = db;
}

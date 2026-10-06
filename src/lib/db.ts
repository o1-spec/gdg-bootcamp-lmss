/*
|--------------------------------------------------
| npm imports
|--------------------------------------------------
*/
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

/*
|--------------------------------------------------
| custom imports
|--------------------------------------------------
*/
import { validateServerEnv } from "./env";

/*
|--------------------------------------------------
| environment validation
|--------------------------------------------------
| Validate critical env vars at module load time.
| Throws in production if DATABASE_URL / JWT secrets are missing.
*/
validateServerEnv();

/*
|--------------------------------------------------
| connection pool setup
|--------------------------------------------------
*/
const globalForPrisma = globalThis as unknown as {
  pool?: Pool;
  prisma?: PrismaClient;
};

const pool =
  globalForPrisma.pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    // Conservative pool sizing for Supabase PgBouncer + Vercel serverless.
    max: 5,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
  });

const adapter = new PrismaPg(pool);

/*
|--------------------------------------------------
| database client instance
|--------------------------------------------------
*/
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

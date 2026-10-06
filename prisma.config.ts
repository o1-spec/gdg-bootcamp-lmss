/*
|--------------------------------------------------
| npm imports
|--------------------------------------------------
*/
import "dotenv/config";
import { defineConfig } from "prisma/config";

/*
|--------------------------------------------------
| constants
|--------------------------------------------------
*/
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DIRECT_URL || process.env.DATABASE_URL,
  },
});


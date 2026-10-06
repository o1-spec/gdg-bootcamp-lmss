/*
|--------------------------------------------------
| constants
|--------------------------------------------------
*/
const REQUIRED_SERVER_VARS = [
  "DATABASE_URL",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
] as const;

/*
|----------------------------------------------------------------------------------------------------
| validateServerEnv
|----------------------------------------------------------------------------------------------------
| Server-side environment variable validation.
| Must never be imported in client components.
| Called once at the top of db.ts and jwt.ts to fail fast with a clear message.
*/
export function validateServerEnv(): void {
  const missing = REQUIRED_SERVER_VARS.filter((key) => !process.env[key]);

  if (missing.length === 0) return;

  const message =
    `[env] Missing required environment variables: ${missing.join(", ")}.\n` +
    "Set them in your deployment environment or in a local .env file.\n" +
    "See .env.example for the full list of required variables.";

  if (process.env.NODE_ENV === "production") {
    throw new Error(message);
  } else {
    console.warn(`\n⚠️  ${message}\n`);
  }
}

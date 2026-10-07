/*
|--------------------------------------------------
| npm imports
|--------------------------------------------------
*/
import { SignJWT, jwtVerify, JWTPayload } from "jose";
import { Role } from "@prisma/client";

/*
|--------------------------------------------------
| constants
|--------------------------------------------------
*/
const ACCESS_TOKEN_EXPIRATION = "15m";
const REFRESH_TOKEN_EXPIRATION = "7d";

/*
|--------------------------------------------------
| helpers — secret key getters
|--------------------------------------------------
| Access and refresh secret encoders for jose HMAC operations.
*/
function getSecretKey(secret: string | undefined, name: string): Uint8Array {
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        `[JWT] Missing required environment variable: ${name}. ` +
          "Set it in your deployment environment before starting the server."
      );
    }
    // Development-only fallback — never present in production
    return new TextEncoder().encode(
      `dev_fallback_${name.toLowerCase()}_minimum_32_chars_long`
    );
  }
  return new TextEncoder().encode(secret);
}

const accessSecret = () =>
  getSecretKey(
    process.env.JWT_ACCESS_SECRET || process.env.AUTH_SECRET,
    "JWT_ACCESS_SECRET"
  );

const refreshSecret = () =>
  getSecretKey(
    process.env.JWT_REFRESH_SECRET ||
      (process.env.AUTH_SECRET ? `${process.env.AUTH_SECRET}_refresh` : undefined),
    "JWT_REFRESH_SECRET"
  );

/*
|--------------------------------------------------
| types
|--------------------------------------------------
*/
export interface AccessTokenPayload extends JWTPayload {
  sub: string;
  email: string;
  role: Role;
}

export interface RefreshTokenPayload extends JWTPayload {
  sub: string;
  ver?: number;
}

/*
|----------------------------------------------------------------------------------------------------
| signAccessToken
|----------------------------------------------------------------------------------------------------
| Signs a short-lived (15 min) JWT Access Token containing user ID, email, and role.
*/
export async function signAccessToken(payload: {
  sub: string;
  email: string;
  role: Role;
}): Promise<string> {
  return new SignJWT({
    sub: payload.sub,
    email: payload.email,
    role: payload.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRATION)
    .sign(accessSecret());
}

/*
|----------------------------------------------------------------------------------------------------
| verifyAccessToken
|----------------------------------------------------------------------------------------------------
| Verifies a JWT Access Token. Returns decoded payload or null if expired or invalid.
*/
export async function verifyAccessToken(
  token: string
): Promise<AccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, accessSecret(), {
      algorithms: ["HS256"],
    });

    if (!payload.sub || !payload.email || !payload.role) {
      return null;
    }

    return {
      sub: payload.sub,
      email: String(payload.email),
      role: payload.role as Role,
      ...payload,
    };
  } catch {
    return null;
  }
}

/*
|----------------------------------------------------------------------------------------------------
| signRefreshToken
|----------------------------------------------------------------------------------------------------
| Signs a long-lived (7 day) JWT Refresh Token containing the subject identifier.
*/
export async function signRefreshToken(payload: {
  sub: string;
  ver: number;
}): Promise<string> {
  return new SignJWT({
    sub: payload.sub,
    ver: payload.ver,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRATION)
    .sign(refreshSecret());
}

/*
|----------------------------------------------------------------------------------------------------
| verifyRefreshToken
|----------------------------------------------------------------------------------------------------
| Verifies a JWT Refresh Token. Returns decoded payload or null if expired or invalid.
*/
export async function verifyRefreshToken(
  token: string
): Promise<RefreshTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, refreshSecret(), {
      algorithms: ["HS256"],
    });

    if (!payload.sub) {
      return null;
    }

    return {
      sub: payload.sub,
      ...payload,
    };
  } catch {
    return null;
  }
}

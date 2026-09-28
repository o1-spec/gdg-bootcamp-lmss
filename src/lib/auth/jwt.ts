import { SignJWT, jwtVerify, JWTPayload } from "jose";
import { Role } from "@prisma/client";

const ACCESS_TOKEN_EXPIRATION = "15m";
const REFRESH_TOKEN_EXPIRATION = "7d";

// Access & Refresh secret encoders
function getSecretKey(secret: string | undefined, defaultSecret: string): Uint8Array {
  const secretString = secret || defaultSecret;
  return new TextEncoder().encode(secretString);
}

const accessSecret = () =>
  getSecretKey(
    process.env.JWT_ACCESS_SECRET || process.env.AUTH_SECRET,
    "development_fallback_jwt_access_secret_key_minimum_32_chars"
  );

const refreshSecret = () =>
  getSecretKey(
    process.env.JWT_REFRESH_SECRET || (process.env.AUTH_SECRET ? `${process.env.AUTH_SECRET}_refresh` : undefined),
    "development_fallback_jwt_refresh_secret_key_minimum_32_chars"
  );

export interface AccessTokenPayload extends JWTPayload {
  sub: string;
  email: string;
  role: Role;
}

export interface RefreshTokenPayload extends JWTPayload {
  sub: string;
}

/**
 * Signs a short-lived (15 min) JWT Access Token.
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

/**
 * Verifies a JWT Access Token. Returns the decoded payload or null if invalid/expired.
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

/**
 * Signs a long-lived (7 day) JWT Refresh Token.
 */
export async function signRefreshToken(payload: {
  sub: string;
}): Promise<string> {
  return new SignJWT({
    sub: payload.sub,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRATION)
    .sign(refreshSecret());
}

/**
 * Verifies a JWT Refresh Token. Returns the decoded payload or null if invalid/expired.
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

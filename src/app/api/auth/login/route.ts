/*
|--------------------------------------------------
| npm imports
|--------------------------------------------------
*/
import { NextRequest, NextResponse } from "next/server";

/*
|--------------------------------------------------
| custom imports
|--------------------------------------------------
*/
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { rateLimit, getClientIp } from "@/lib/auth/rate-limit";
import { signAccessToken, signRefreshToken } from "@/lib/auth/jwt";
import {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  ACCESS_COOKIE_MAX_AGE,
  REFRESH_COOKIE_MAX_AGE,
  authCookieOptions,
  getRoleDashboardPath,
} from "@/lib/auth/session";

// Compared against when the email is unknown so response time does not reveal which emails exist
let dummyHash: Promise<string> | null = null;
function getDummyHash() {
  dummyHash ??= hashPassword("not-a-real-password-0");
  return dummyHash;
}

/*
|----------------------------------------------------------------------------------------------------
| POST
|----------------------------------------------------------------------------------------------------
| Handles incoming HTTP POST requests for this endpoint.
*/
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || typeof body.email !== "string" || typeof body.password !== "string") {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 400 }
      );
    }

    const email = body.email.toLowerCase().trim();
    const password = body.password;

    const limited = rateLimit(`login:${getClientIp(req)}:${email}`, 10, 15 * 60 * 1000);
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } }
      );
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 400 }
      );
    }

    // Lookup user by email
    const user = await db.user.findUnique({
      where: { email },
    });

    // Always run one bcrypt comparison so timing is the same for known and unknown emails
    const isValidPassword = await verifyPassword(
      password,
      user ? user.passwordHash : await getDummyHash()
    );
    if (!user || !isValidPassword) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Issue short-lived access token and longer-lived refresh token
    const accessToken = await signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = await signRefreshToken({
      sub: user.id,
    });

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const response = NextResponse.json(
      {
        user: safeUser,
        redirectTo: getRoleDashboardPath(user.role),
      },
      { status: 200 }
    );

    // Set secure HTTP-only cookies
    response.cookies.set({
      name: ACCESS_COOKIE_NAME,
      value: accessToken,
      ...authCookieOptions,
      maxAge: ACCESS_COOKIE_MAX_AGE,
    });

    response.cookies.set({
      name: REFRESH_COOKIE_NAME,
      value: refreshToken,
      ...authCookieOptions,
      maxAge: REFRESH_COOKIE_MAX_AGE,
    });

    return response;
  } catch (error) {
    console.error("Login endpoint error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during login" },
      { status: 500 }
    );
  }
}

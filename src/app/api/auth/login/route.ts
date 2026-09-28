import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { signAccessToken, signRefreshToken } from "@/lib/auth/jwt";
import {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  ACCESS_COOKIE_MAX_AGE,
  REFRESH_COOKIE_MAX_AGE,
  authCookieOptions,
  getRoleDashboardPath,
} from "@/lib/auth/session";

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

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password against stored hash
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
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

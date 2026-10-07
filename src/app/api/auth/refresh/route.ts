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
import { isSameOrigin } from "@/lib/auth/origin";
import { verifyRefreshToken, signAccessToken } from "@/lib/auth/jwt";
import {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  ACCESS_COOKIE_MAX_AGE,
  authCookieOptions,
} from "@/lib/auth/session";

/*
|----------------------------------------------------------------------------------------------------
| POST
|----------------------------------------------------------------------------------------------------
| Handles incoming HTTP POST requests for this endpoint.
*/
export async function POST(req: NextRequest) {
  try {
    if (!isSameOrigin(req)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const refreshToken = req.cookies.get(REFRESH_COOKIE_NAME)?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: "No refresh token provided" },
        { status: 401 }
      );
    }

    const payload = await verifyRefreshToken(refreshToken);
    if (!payload?.sub) {
      return NextResponse.json(
        { error: "Invalid or expired refresh token" },
        { status: 401 }
      );
    }

    // Retrieve user from the database to ensure the account is active and role is up to date
    const user = await db.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tokenVersion: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User no longer exists" },
        { status: 401 }
      );
    }

    // Tokens issued before the last logout carry an older version and are revoked
    if ((payload.ver ?? 0) !== user.tokenVersion) {
      return NextResponse.json(
        { error: "Session has been revoked" },
        { status: 401 }
      );
    }

    // Issue a new access token
    const newAccessToken = await signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const { tokenVersion: _tokenVersion, ...safeUser } = user;
    void _tokenVersion;

    const response = NextResponse.json(
      {
        success: true,
        user: safeUser,
      },
      { status: 200 }
    );

    // Update access cookie
    response.cookies.set({
      name: ACCESS_COOKIE_NAME,
      value: newAccessToken,
      ...authCookieOptions,
      maxAge: ACCESS_COOKIE_MAX_AGE,
    });

    return response;
  } catch (error) {
    console.error("Refresh endpoint error:", error);
    return NextResponse.json(
      { error: "Failed to refresh session" },
      { status: 500 }
    );
  }
}

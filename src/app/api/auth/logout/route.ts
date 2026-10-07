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
import { verifyRefreshToken } from "@/lib/auth/jwt";
import {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  authCookieOptions,
} from "@/lib/auth/session";

/*
|----------------------------------------------------------------------------------------------------
| POST
|----------------------------------------------------------------------------------------------------
| Handles incoming HTTP POST requests for this endpoint.
*/
export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Revoke every refresh token issued so far for this user
  const refreshToken = req.cookies.get(REFRESH_COOKIE_NAME)?.value;
  const payload = refreshToken ? await verifyRefreshToken(refreshToken) : null;
  if (payload?.sub) {
    try {
      await db.user.update({
        where: { id: payload.sub },
        data: { tokenVersion: { increment: 1 } },
      });
    } catch (err) {
      console.error("Logout could not revoke refresh tokens:", err);
    }
  }

  const response = NextResponse.json(
    { success: true, message: "Logged out successfully" },
    { status: 200 }
  );

  // Clear authentication cookies
  response.cookies.set({
    name: ACCESS_COOKIE_NAME,
    value: "",
    ...authCookieOptions,
    maxAge: 0,
  });

  response.cookies.set({
    name: REFRESH_COOKIE_NAME,
    value: "",
    ...authCookieOptions,
    maxAge: 0,
  });

  return response;
}

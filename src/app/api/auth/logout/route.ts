/*
|--------------------------------------------------
| npm imports
|--------------------------------------------------
*/
import { NextResponse } from "next/server";

/*
|--------------------------------------------------
| custom imports
|--------------------------------------------------
*/
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
export async function POST() {
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

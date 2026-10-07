/*
|--------------------------------------------------
| npm imports
|--------------------------------------------------
*/
import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";

/*
|--------------------------------------------------
| custom imports
|--------------------------------------------------
*/
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { rateLimit, getClientIp } from "@/lib/auth/rate-limit";
import { signAccessToken, signRefreshToken } from "@/lib/auth/jwt";
import {
  ACCESS_COOKIE_NAME,
  ACCESS_COOKIE_MAX_AGE,
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_MAX_AGE,
  authCookieOptions,
  getRoleDashboardPath,
} from "@/lib/auth/session";

/*
|----------------------------------------------------------------------------------------------------
| isValidPassword
|----------------------------------------------------------------------------------------------------
| Validates that a password satisfies minimum complexity requirements (8+ chars, letter, and number).
*/
function isValidPassword(password: string) {
  return password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
}

// One message for every "cannot sign up" reason so the form does not reveal which emails are approved
const SIGNUP_DENIED_MESSAGE =
  "We could not create an account for this email. Make sure you use the email the program approved, and that you have not already signed up.";

class SignupError extends Error {}

/*
|----------------------------------------------------------------------------------------------------
| POST
|----------------------------------------------------------------------------------------------------
| Handles incoming HTTP POST requests for this endpoint.
*/
export async function POST(request: NextRequest) {
  try {
    const limited = rateLimit(`signup:${getClientIp(request)}`, 10, 60 * 60 * 1000);
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Too many signup attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } }
      );
    }

    const body = await request.json().catch(() => null);
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (name.length < 2 || name.length > 100) {
      return NextResponse.json({ error: "Enter your full name (2–100 characters)." }, { status: 400 });
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    if (!isValidPassword(password)) {
      return NextResponse.json({ error: "Password must be at least 8 characters and include a letter and a number." }, { status: 400 });
    }
    const passwordHash = await hashPassword(password);
    const now = new Date();

    const user = await db.$transaction(async (tx) => {
      const registration = await tx.registration.findUnique({ where: { email } });
      if (!registration || registration.claimedAt) {
        throw new SignupError(SIGNUP_DENIED_MESSAGE);
      }

      const existingUser = await tx.user.findUnique({ where: { email }, select: { id: true } });
      if (existingUser) {
        throw new SignupError(SIGNUP_DENIED_MESSAGE);
      }

      const claimed = await tx.registration.updateMany({
        where: { id: registration.id, claimedAt: null },
        data: { claimedAt: now },
      });
      if (claimed.count !== 1) {
        throw new SignupError(SIGNUP_DENIED_MESSAGE);
      }

      const createdUser = await tx.user.create({
        data: { name, email, passwordHash, role: registration.role },
      });

      if (registration.role === Role.STUDENT) {
        await tx.enrollment.create({ data: { userId: createdUser.id, trackId: registration.trackId } });
      } else if (registration.role === Role.INSTRUCTOR) {
        await tx.trackInstructor.create({ data: { userId: createdUser.id, trackId: registration.trackId } });
      }

      return createdUser;
    });

    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken({ sub: user.id, email: user.email, role: user.role }),
      signRefreshToken({ sub: user.id, ver: user.tokenVersion }),
    ]);
    const response = NextResponse.json({ redirectTo: getRoleDashboardPath(user.role) }, { status: 201 });
    response.cookies.set({ name: ACCESS_COOKIE_NAME, value: accessToken, ...authCookieOptions, maxAge: ACCESS_COOKIE_MAX_AGE });
    response.cookies.set({ name: REFRESH_COOKIE_NAME, value: refreshToken, ...authCookieOptions, maxAge: REFRESH_COOKIE_MAX_AGE });
    return response;
  } catch (error) {
    if (error instanceof SignupError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Signup endpoint error:", error);
    return NextResponse.json({ error: "Unable to create account." }, { status: 500 });
  }
}

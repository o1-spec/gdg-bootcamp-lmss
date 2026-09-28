import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { verifyAccessToken } from "./jwt";

export const ACCESS_COOKIE_NAME = "bootcamp_access";
export const REFRESH_COOKIE_NAME = "bootcamp_refresh";

export const ACCESS_COOKIE_MAX_AGE = 15 * 60; // 15 minutes in seconds
export const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: Date;
}

export const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

/**
 * Retrieves the currently authenticated user from the database using the access token cookie.
 * The database remains the authoritative source of truth.
 */
export async function getCurrentUser(): Promise<SafeUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ACCESS_COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    const payload = await verifyAccessToken(token);
    if (!payload?.sub) {
      return null;
    }

    // Fetch user from the database to ensure authoritative status and role
    const user = await db.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return user;
  } catch (err) {
    // If the database connection fails or tables are not yet migrated, fail gracefully
    console.error("Error in getCurrentUser:", err);
    return null;
  }
}

/**
 * Requires an authenticated user session. Redirects to /login if unauthenticated.
 */
export async function requireUser(): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

/**
 * Redirects user to their role-appropriate home dashboard.
 */
export function getRoleDashboardPath(role: Role): string {
  switch (role) {
    case Role.ADMIN:
      return "/admin/dashboard";
    case Role.INSTRUCTOR:
      return "/instructor/dashboard";
    case Role.STUDENT:
    default:
      return "/dashboard";
  }
}

/**
 * Requires the current user to have one of the permitted roles.
 * If unauthorized, safely redirects to the user's correct role dashboard to avoid loops.
 */
export async function requireRole(allowedRoles: Role[]): Promise<SafeUser> {
  const user = await requireUser();

  if (!allowedRoles.includes(user.role)) {
    redirect(getRoleDashboardPath(user.role));
  }

  return user;
}

export async function requireStudent(): Promise<SafeUser> {
  return requireRole([Role.STUDENT]);
}

export async function requireInstructor(): Promise<SafeUser> {
  return requireRole([Role.INSTRUCTOR]);
}

export async function requireAdmin(): Promise<SafeUser> {
  return requireRole([Role.ADMIN]);
}

/**
 * Verifies track access rules against the database:
 * - ADMIN: can access every track
 * - INSTRUCTOR: may access only tracks present in TrackInstructor
 * - STUDENT: may access only their active enrolled track (startDate <= now and endDate is null or > now)
 */
export async function requireTrackAccess(
  userId: string,
  trackId: string
): Promise<boolean> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) return false;

    // 1. Admin can access all tracks
    if (user.role === Role.ADMIN) {
      return true;
    }

    // 2. Instructor track check
    if (user.role === Role.INSTRUCTOR) {
      const assignment = await db.trackInstructor.findUnique({
        where: {
          trackId_userId: {
            trackId,
            userId,
          },
        },
      });
      return !!assignment;
    }

    // 3. Student active enrollment check
    if (user.role === Role.STUDENT) {
      const now = new Date();
      const enrollment = await db.enrollment.findFirst({
        where: {
          userId,
          trackId,
          startDate: { lte: now },
          OR: [{ endDate: null }, { endDate: { gt: now } }],
        },
      });
      return !!enrollment;
    }

    return false;
  } catch (error) {
    console.error("Error verifying track access:", error);
    return false;
  }
}

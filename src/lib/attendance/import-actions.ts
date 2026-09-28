"use server";

import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { audit } from "@/lib/audit/logger";

/**
 * Flexible CSV parser — no external library.
 * Handles quoted fields, comma-separated, first row as headers.
 */
function parseCSV(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  if (lines.length < 2) return [];

  // Normalize headers
  const headers = lines[0]
    .split(",")
    .map((h) => h.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_"));

  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple split — handle basic quoted fields
    const values: string[] = [];
    let inQuote = false;
    let current = "";
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; continue; }
      if (ch === "," && !inQuote) { values.push(current.trim()); current = ""; }
      else current += ch;
    }
    values.push(current.trim());

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = values[idx] ?? ""; });
    rows.push(row);
  }
  return rows;
}

/**
 * Map flexible header names to canonical fields.
 */
function extractEmail(row: Record<string, string>): string {
  return (
    row["email"] ??
    row["email_address"] ??
    row["participant_email"] ??
    row["user_email"] ??
    ""
  ).toLowerCase().trim();
}

function extractName(row: Record<string, string>): string {
  return (
    row["name"] ??
    row["participant_name"] ??
    row["display_name"] ??
    row["full_name"] ??
    ""
  ).trim();
}

// ── Parse upload (Step 1) ──────────────────────────────────────────────────────

export async function parseAttendanceImport(
  sessionId: string,
  csvText: string,
  user: { id: string; role: string }
): Promise<{
  success: boolean;
  importId?: string;
  preview?: {
    matched: { email: string; name: string; userId: string; lmsStatus: string | null }[];
    unmatched: { email: string; name: string }[];
    totalRows: number;
  };
  error?: string;
}> {
  if (user.role === "STUDENT") return { success: false, error: "Access denied." };

  // Verify session exists and user has access
  const session = await db.session.findUnique({
    where: { id: sessionId },
    select: { trackId: true, cohortId: true },
  });
  if (!session) return { success: false, error: "Session not found." };

  if (user.role === "INSTRUCTOR" && session.trackId) {
    const assigned = await db.trackInstructor.findUnique({
      where: { trackId_userId: { trackId: session.trackId, userId: user.id } },
    });
    if (!assigned) return { success: false, error: "You are not assigned to this session's track." };
  }

  // Parse CSV
  const rows = parseCSV(csvText);
  if (!rows.length) return { success: false, error: "No data rows found in CSV." };

  // Get enrolled users in this cohort/track
  const enrollments = await db.enrollment.findMany({
    where: {
      track: { cohortId: session.cohortId },
      ...(session.trackId ? { trackId: session.trackId } : {}),
    },
    include: { user: { select: { id: true, email: true, name: true } } },
  });
  const emailToUser = new Map(
    enrollments.map((e) => [e.user.email.toLowerCase(), e.user])
  );

  // Get existing attendance
  const existingAttendance = await db.attendance.findMany({
    where: { sessionId },
    select: { userId: true, status: true },
  });
  const attendanceMap = new Map(existingAttendance.map((a) => [a.userId, a.status]));

  const matched: { email: string; name: string; userId: string; lmsStatus: string | null }[] = [];
  const unmatched: { email: string; name: string }[] = [];
  const seenEmails = new Set<string>();

  for (const row of rows) {
    const email = extractEmail(row);
    const name = extractName(row);
    if (!email) continue;
    if (seenEmails.has(email)) continue; // duplicate row
    seenEmails.add(email);

    const matchedUser = emailToUser.get(email);
    if (matchedUser) {
      matched.push({
        email,
        name: name || matchedUser.name,
        userId: matchedUser.id,
        lmsStatus: attendanceMap.get(matchedUser.id) ?? null,
      });
    } else {
      unmatched.push({ email, name });
    }
  }

  // Store import record for confirmation step
  const importRecord = await db.attendanceImport.create({
    data: {
      sessionId,
      importedById: user.id,
      rowCount: rows.length,
      matchedCount: matched.length,
      status: "PENDING_REVIEW",
      rawRows: { matched, unmatched } as unknown as Parameters<typeof db.attendanceImport.create>[0]["data"]["rawRows"],
    },
  });

  return {
    success: true,
    importId: importRecord.id,
    preview: { matched, unmatched, totalRows: rows.length },
  };
}

export async function parseAttendanceImportAction(
  sessionId: string,
  csvText: string
) {
  const user = await requireUser();
  return parseAttendanceImport(sessionId, csvText, user);
}

// ── Apply confirmed import (Step 2) ───────────────────────────────────────────

export async function applyAttendanceImport(
  importId: string,
  confirmedUserIds: string[],
  user: { id: string; role: string }
): Promise<{ success: boolean; updated: number; error?: string }> {
  if (user.role === "STUDENT") return { success: false, updated: 0, error: "Access denied." };

  const importRecord = await db.attendanceImport.findUnique({
    where: { id: importId },
    include: { session: { select: { trackId: true, cohortId: true } } },
  });
  if (!importRecord) return { success: false, updated: 0, error: "Import not found." };
  if (importRecord.status !== "PENDING_REVIEW") {
    return { success: false, updated: 0, error: "Import already applied or discarded." };
  }

  // Re-check instructor access
  if (user.role === "INSTRUCTOR" && importRecord.session.trackId) {
    const assigned = await db.trackInstructor.findUnique({
      where: { trackId_userId: { trackId: importRecord.session.trackId, userId: user.id } },
    });
    if (!assigned) return { success: false, updated: 0, error: "Access denied." };
  }

  let updated = 0;
  for (const userId of confirmedUserIds) {
    await db.attendance.upsert({
      where: { sessionId_userId: { sessionId: importRecord.sessionId, userId } },
      update: { status: "PRESENT", method: "IMPORT", markedById: user.id, markedAt: new Date() },
      create: {
        sessionId: importRecord.sessionId,
        userId,
        status: "PRESENT",
        method: "IMPORT",
        markedById: user.id,
      },
    });
    updated++;
  }

  // Mark import as applied
  await db.attendanceImport.update({
    where: { id: importId },
    data: { status: "APPLIED" },
  });

  audit(user.id, "ATTENDANCE_IMPORT_APPLIED", "Session", importRecord.sessionId, {
    importId,
    updatedCount: updated,
  });

  return { success: true, updated };
}

export async function applyAttendanceImportAction(
  importId: string,
  confirmedUserIds: string[]
): Promise<{ success: boolean; updated: number; error?: string }> {
  const user = await requireUser();
  const res = await applyAttendanceImport(importId, confirmedUserIds, user);
  if (res.success) {
    const importRecord = await db.attendanceImport.findUnique({
      where: { id: importId },
      select: { sessionId: true },
    });
    if (importRecord) {
      revalidatePath(`/instructor/classes/${importRecord.sessionId}/attendance`);
      revalidatePath(`/admin/classes/${importRecord.sessionId}/attendance`);
    }
  }
  return res;
}

export async function discardImportAction(
  importId: string
): Promise<{ success: boolean }> {
  const user = await requireUser();
  if (user.role === "STUDENT") return { success: false };
  await db.attendanceImport.update({
    where: { id: importId },
    data: { status: "DISCARDED" },
  });
  return { success: true };
}

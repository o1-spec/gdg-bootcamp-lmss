"use server";

/*
|--------------------------------------------------
| npm imports
|--------------------------------------------------
*/
import { revalidatePath } from "next/cache";

/*
|--------------------------------------------------
| custom imports
|--------------------------------------------------
*/
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { parseAttendanceImport, applyAttendanceImport } from "./import-queries";

/*
|----------------------------------------------------------------------------------------------------
| parseAttendanceImportAction
|----------------------------------------------------------------------------------------------------
| Server action handling parse Attendance Import workflows and cache revalidations.
*/
export async function parseAttendanceImportAction(
  sessionId: string,
  csvText: string
) {
  const user = await requireUser();
  return parseAttendanceImport(sessionId, csvText, user);
}

/*
|----------------------------------------------------------------------------------------------------
| applyAttendanceImportAction
|----------------------------------------------------------------------------------------------------
| Server action handling apply Attendance Import workflows and cache revalidations.
*/
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

/*
|----------------------------------------------------------------------------------------------------
| discardImportAction
|----------------------------------------------------------------------------------------------------
| Server action handling discard Import workflows and cache revalidations.
*/
export async function discardImportAction(
  importId: string
): Promise<{ success: boolean }> {
  const user = await requireUser();
  if (user.role === "STUDENT") return { success: false };
  const rec = await db.attendanceImport.findUnique({
    where: { id: importId },
    select: { importedById: true, status: true },
  });
  if (!rec || rec.status !== "PENDING_REVIEW") return { success: false };
  if (user.role !== "ADMIN" && rec.importedById !== user.id) return { success: false };
  await db.attendanceImport.update({
    where: { id: importId },
    data: { status: "DISCARDED" },
  });
  return { success: true };
}

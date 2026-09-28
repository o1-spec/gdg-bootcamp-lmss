"use server";

import { revalidatePath } from "next/cache";
import { AttendanceStatus } from "@prisma/client";
import { requireUser } from "@/lib/auth/session";
import {
  checkInToSession,
  markAttendance,
  setSessionCheckinCode,
} from "./queries";

export async function checkInAction(
  sessionId: string,
  formData: FormData
): Promise<{ success: boolean; message: string; status?: AttendanceStatus }> {
  const user = await requireUser();
  const code = formData.get("code")?.toString().trim() || "";

  try {
    const result = await checkInToSession(sessionId, code, user.id);

    revalidatePath("/attendance");
    revalidatePath("/classes");
    revalidatePath(`/classes/${sessionId}`);
    revalidatePath(`/classes/${sessionId}/check-in`);
    revalidatePath(`/instructor/classes/${sessionId}/attendance`);
    revalidatePath(`/admin/classes/${sessionId}/attendance`);

    return result;
  } catch (err: unknown) {
    if (err instanceof Error) {
      return { success: false, message: err.message };
    }
    return { success: false, message: "Check-in failed. Please try again." };
  }
}

export async function markAttendanceAction(
  sessionId: string,
  targetUserId: string,
  status: AttendanceStatus
): Promise<{ success: boolean; message?: string }> {
  const user = await requireUser();

  try {
    await markAttendance(
      sessionId,
      targetUserId,
      status,
      user.id,
      user.role
    );

    revalidatePath(`/instructor/classes/${sessionId}/attendance`);
    revalidatePath(`/admin/classes/${sessionId}/attendance`);
    revalidatePath("/instructor/attendance");
    revalidatePath("/admin/attendance");
    revalidatePath("/attendance");

    return { success: true };
  } catch (err: unknown) {
    if (err instanceof Error) {
      return { success: false, message: err.message };
    }
    return { success: false, message: "Failed to mark attendance." };
  }
}

export async function generateCheckinCodeAction(
  sessionId: string
): Promise<{ success: boolean; code?: string; message?: string }> {
  const user = await requireUser();

  try {
    const code = await setSessionCheckinCode(sessionId, user.id, user.role);

    revalidatePath(`/instructor/classes/${sessionId}/attendance`);
    revalidatePath(`/admin/classes/${sessionId}/attendance`);
    revalidatePath(`/instructor/classes/${sessionId}`);
    revalidatePath(`/admin/classes/${sessionId}`);

    return { success: true, code };
  } catch (err: unknown) {
    if (err instanceof Error) {
      return { success: false, message: err.message };
    }
    return { success: false, message: "Failed to generate code." };
  }
}

export async function setCheckinCodeAction(
  sessionId: string,
  formData: FormData
): Promise<{ success: boolean; code?: string; message?: string }> {
  const user = await requireUser();
  const rawCode = formData.get("code")?.toString().trim();

  try {
    const code = await setSessionCheckinCode(
      sessionId,
      user.id,
      user.role,
      rawCode
    );

    revalidatePath(`/instructor/classes/${sessionId}/attendance`);
    revalidatePath(`/admin/classes/${sessionId}/attendance`);
    revalidatePath(`/instructor/classes/${sessionId}`);
    revalidatePath(`/admin/classes/${sessionId}`);

    return { success: true, code };
  } catch (err: unknown) {
    if (err instanceof Error) {
      return { success: false, message: err.message };
    }
    return { success: false, message: "Failed to set code." };
  }
}

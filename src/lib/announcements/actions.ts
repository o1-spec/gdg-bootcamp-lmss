"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import {
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "./queries";
import { notifyAnnouncement } from "@/lib/notifications/queries";

export interface AnnouncementActionState {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function createAnnouncementAction(
  prevState: unknown,
  formData: FormData
): Promise<AnnouncementActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Authentication required" };
  }

  const title = formData.get("title") as string;
  const body = formData.get("body") as string;
  const cohortId = formData.get("cohortId") as string;
  const trackIdRaw = formData.get("trackId") as string;

  const trackId = trackIdRaw && trackIdRaw !== "all" && trackIdRaw !== "" ? trackIdRaw : null;

  const fieldErrors: Record<string, string> = {};
  if (!title || !title.trim()) fieldErrors.title = "Title is required";
  if (!body || !body.trim()) fieldErrors.body = "Message body is required";
  if (!cohortId || !cohortId.trim()) fieldErrors.cohortId = "Cohort is required";

  if (Object.keys(fieldErrors).length > 0) {
    return { success: false, fieldErrors };
  }

  try {
    await createAnnouncement(
      {
        title: title.trim(),
        body: body.trim(),
        cohortId: cohortId.trim(),
        trackId,
      },
      user.id,
      user.role
    );

    // Notify enrolled students (fire-and-forget)
    notifyAnnouncement(cohortId.trim(), trackId, title.trim()).catch(() => {});

    revalidatePath("/announcements");
    revalidatePath("/instructor/announcements");
    revalidatePath("/admin/announcements");
    revalidatePath("/dashboard");
    revalidatePath("/instructor/dashboard");
    revalidatePath("/admin/dashboard");

    return { success: true };
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "Failed to create announcement";
    return { success: false, error };
  }
}

export async function updateAnnouncementAction(
  id: string,
  prevState: unknown,
  formData: FormData
): Promise<AnnouncementActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Authentication required" };
  }

  const title = formData.get("title") as string;
  const body = formData.get("body") as string;
  const trackIdRaw = formData.get("trackId") as string;

  const trackId = trackIdRaw && trackIdRaw !== "all" && trackIdRaw !== "" ? trackIdRaw : null;

  const fieldErrors: Record<string, string> = {};
  if (!title || !title.trim()) fieldErrors.title = "Title is required";
  if (!body || !body.trim()) fieldErrors.body = "Message body is required";

  if (Object.keys(fieldErrors).length > 0) {
    return { success: false, fieldErrors };
  }

  try {
    await updateAnnouncement(
      id,
      {
        title: title.trim(),
        body: body.trim(),
        trackId,
      },
      user.id,
      user.role
    );

    revalidatePath("/announcements");
    revalidatePath("/instructor/announcements");
    revalidatePath("/admin/announcements");
    revalidatePath("/dashboard");
    revalidatePath("/instructor/dashboard");
    revalidatePath("/admin/dashboard");

    return { success: true };
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "Failed to update announcement";
    return { success: false, error };
  }
}

export async function deleteAnnouncementAction(id: string): Promise<AnnouncementActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Authentication required" };
  }

  try {
    await deleteAnnouncement(id, user.id, user.role);

    revalidatePath("/announcements");
    revalidatePath("/instructor/announcements");
    revalidatePath("/admin/announcements");
    revalidatePath("/dashboard");
    revalidatePath("/instructor/dashboard");
    revalidatePath("/admin/dashboard");

    return { success: true };
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "Failed to delete announcement";
    return { success: false, error };
  }
}

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
import { getCurrentUser } from "@/lib/auth/session";
import {
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "./queries";
import { notifyAnnouncement } from "@/lib/notifications/queries";

/*
|--------------------------------------------------
| types
|--------------------------------------------------
*/
export interface AnnouncementActionState {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

/*
|----------------------------------------------------------------------------------------------------
| createAnnouncementAction
|----------------------------------------------------------------------------------------------------
| Server action validating form input and publishing cohort-wide or track-specific announcements.
*/
export async function createAnnouncementAction(
  prevState: unknown,
  formData: FormData
): Promise<AnnouncementActionState> {
  /*
  |--------------------------------------------------
  | authentication validation
  |--------------------------------------------------
  */
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Authentication required" };
  }

  /*
  |--------------------------------------------------
  | form parsing & payload validation
  |--------------------------------------------------
  */
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

  /*
  |--------------------------------------------------
  | database mutation & cache revalidation
  |--------------------------------------------------
  */
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

/*
|----------------------------------------------------------------------------------------------------
| updateAnnouncementAction
|----------------------------------------------------------------------------------------------------
| Server action allowing authors and admins to modify existing announcement content and audience.
*/
export async function updateAnnouncementAction(
  id: string,
  prevState: unknown,
  formData: FormData
): Promise<AnnouncementActionState> {
  /*
  |--------------------------------------------------
  | authentication validation
  |--------------------------------------------------
  */
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Authentication required" };
  }

  /*
  |--------------------------------------------------
  | form parsing & validation
  |--------------------------------------------------
  */
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

  /*
  |--------------------------------------------------
  | database mutation & cache revalidation
  |--------------------------------------------------
  */
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

/*
|----------------------------------------------------------------------------------------------------
| deleteAnnouncementAction
|----------------------------------------------------------------------------------------------------
| Server action permanently removing an announcement and refreshing dependent dashboard paths.
*/
export async function deleteAnnouncementAction(id: string): Promise<AnnouncementActionState> {
  /*
  |--------------------------------------------------
  | authentication validation
  |--------------------------------------------------
  */
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Authentication required" };
  }

  /*
  |--------------------------------------------------
  | database mutation & cache revalidation
  |--------------------------------------------------
  */
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

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
import { markNotificationRead, markAllRead } from "./queries";

/*
|----------------------------------------------------------------------------------------------------
| markReadAction
|----------------------------------------------------------------------------------------------------
| Server action handling mark Read workflows and cache revalidations.
*/
export async function markReadAction(
  notificationId: string
): Promise<{ success: boolean }> {
  const user = await requireUser();
  await markNotificationRead(notificationId, user.id);
  revalidatePath("/notifications");
  return { success: true };
}

/*
|----------------------------------------------------------------------------------------------------
| markAllReadAction
|----------------------------------------------------------------------------------------------------
| Server action handling mark All Read workflows and cache revalidations.
*/
export async function markAllReadAction(): Promise<{ success: boolean }> {
  const user = await requireUser();
  await markAllRead(user.id);
  revalidatePath("/notifications");
  return { success: true };
}

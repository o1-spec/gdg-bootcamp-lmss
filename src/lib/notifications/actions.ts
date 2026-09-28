"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { markNotificationRead, markAllRead } from "./queries";

export async function markReadAction(
  notificationId: string
): Promise<{ success: boolean }> {
  const user = await requireUser();
  await markNotificationRead(notificationId, user.id);
  revalidatePath("/notifications");
  return { success: true };
}

export async function markAllReadAction(): Promise<{ success: boolean }> {
  const user = await requireUser();
  await markAllRead(user.id);
  revalidatePath("/notifications");
  return { success: true };
}

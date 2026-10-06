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
import {
  getChannelIfAuthorized,
  createMessage,
  softDeleteMessage,
  getMessageById,
  muteUser,
  unmuteUser,
} from "./queries";
import { audit } from "@/lib/audit/logger";
import { db } from "@/lib/db";

/*
|----------------------------------------------------------------------------------------------------
| sendMessageAction
|----------------------------------------------------------------------------------------------------
| Server action handling send Message workflows and cache revalidations.
*/
export async function sendMessageAction(
  channelId: string,
  body: string
): Promise<{ success: boolean; error?: string }> {
  const user = await requireUser();
  const trimmed = body.trim();
  if (!trimmed || trimmed.length > 2000) {
    return { success: false, error: "Message must be 1–2000 characters." };
  }

  const channel = await getChannelIfAuthorized(channelId, user.id, user.role);
  if (!channel) return { success: false, error: "Channel not found or access denied." };

  // Check mute
  const now = new Date();
  const mute = await db.chatMute.findFirst({
    where: {
      userId: user.id,
      cohortId: channel.cohortId,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
  });
  if (mute) return { success: false, error: "You have been muted in this channel." };

  await createMessage(channelId, user.id, trimmed);
  revalidatePath(`/chat/${channelId}`);
  revalidatePath(`/instructor/chat/${channelId}`);
  revalidatePath(`/admin/chat/${channelId}`);
  return { success: true };
}

/*
|----------------------------------------------------------------------------------------------------
| deleteMessageAction
|----------------------------------------------------------------------------------------------------
| Deletes or archives a Message Action record from the database.
*/
export async function deleteMessageAction(
  messageId: string
): Promise<{ success: boolean; error?: string }> {
  const user = await requireUser();
  const msg = await getMessageById(messageId);
  if (!msg) return { success: false, error: "Message not found." };

  const channel = await getChannelIfAuthorized(msg.channelId, user.id, user.role);
  if (!channel) return { success: false, error: "Access denied." };

  // Students can only delete their own messages; instructors/admins can delete any
  if (user.role === "STUDENT" && msg.senderId !== user.id) {
    return { success: false, error: "You can only delete your own messages." };
  }

  await softDeleteMessage(messageId);

  if (user.role !== "STUDENT" || msg.senderId !== user.id) {
    audit(user.id, "MESSAGE_DELETED", "Message", messageId, {
      senderId: msg.senderId,
      channelId: msg.channelId,
    });
  }

  revalidatePath(`/chat/${msg.channelId}`);
  revalidatePath(`/instructor/chat/${msg.channelId}`);
  revalidatePath(`/admin/chat/${msg.channelId}`);
  return { success: true };
}

/*
|----------------------------------------------------------------------------------------------------
| muteUserAction
|----------------------------------------------------------------------------------------------------
| Server action handling mute User workflows and cache revalidations.
*/
export async function muteUserAction(
  userId: string,
  cohortId: string,
  trackId: string | null,
  reason?: string,
  expiresAt?: string
): Promise<{ success: boolean; error?: string }> {
  const moderator = await requireUser();
  if (moderator.role === "STUDENT") return { success: false, error: "Access denied." };

  await muteUser(
    userId,
    cohortId,
    trackId,
    moderator.id,
    reason,
    expiresAt ? new Date(expiresAt) : undefined
  );

  audit(moderator.id, "MUTE_ISSUED", "User", userId, {
    cohortId,
    trackId,
    reason,
  });

  revalidatePath("/admin/chat");
  revalidatePath("/instructor/chat");
  return { success: true };
}

/*
|----------------------------------------------------------------------------------------------------
| unmuteUserAction
|----------------------------------------------------------------------------------------------------
| Server action handling unmute User workflows and cache revalidations.
*/
export async function unmuteUserAction(
  userId: string,
  cohortId: string
): Promise<{ success: boolean; error?: string }> {
  const moderator = await requireUser();
  if (moderator.role === "STUDENT") return { success: false, error: "Access denied." };

  await unmuteUser(userId, cohortId);

  audit(moderator.id, "MUTE_REMOVED", "User", userId, { cohortId });

  revalidatePath("/admin/chat");
  revalidatePath("/instructor/chat");
  return { success: true };
}

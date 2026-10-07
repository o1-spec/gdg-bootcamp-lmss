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
    await audit(user.id, "MESSAGE_DELETED", "Message", messageId, {
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
| canModerateUser
|----------------------------------------------------------------------------------------------------
| Admins may moderate any student. Instructors only students enrolled in a track they teach
| within the given cohort (and, if given, that specific track).
*/
async function canModerateUser(
  moderator: { id: string; role: string },
  targetUserId: string,
  cohortId: string,
  trackId: string | null
): Promise<boolean> {
  const target = await db.user.findUnique({
    where: { id: targetUserId },
    select: { role: true },
  });
  if (!target || target.role !== "STUDENT") return false;

  if (moderator.role === "ADMIN") return true;
  if (moderator.role !== "INSTRUCTOR") return false;

  const taught = await db.trackInstructor.findMany({
    where: { userId: moderator.id, track: { cohortId } },
    select: { trackId: true },
  });
  const taughtIds = taught.map((t) => t.trackId);
  if (trackId && !taughtIds.includes(trackId)) return false;

  const enrolled = await db.enrollment.findFirst({
    where: {
      userId: targetUserId,
      trackId: trackId ?? { in: taughtIds },
      track: { cohortId },
    },
    select: { id: true },
  });
  return !!enrolled;
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
  if (!(await canModerateUser(moderator, userId, cohortId, trackId))) {
    return { success: false, error: "You cannot moderate this user." };
  }
  if (expiresAt && Number.isNaN(new Date(expiresAt).getTime())) {
    return { success: false, error: "Invalid expiry date." };
  }

  await muteUser(
    userId,
    cohortId,
    trackId,
    moderator.id,
    reason,
    expiresAt ? new Date(expiresAt) : undefined
  );

  await audit(moderator.id, "MUTE_ISSUED", "User", userId, {
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
  if (!(await canModerateUser(moderator, userId, cohortId, null))) {
    return { success: false, error: "You cannot moderate this user." };
  }

  await unmuteUser(userId, cohortId);

  await audit(moderator.id, "MUTE_REMOVED", "User", userId, { cohortId });

  revalidatePath("/admin/chat");
  revalidatePath("/instructor/chat");
  return { success: true };
}

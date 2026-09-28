import { db } from "@/lib/db";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ChannelWithMeta {
  id: string;
  name: string;
  cohortId: string;
  trackId: string | null;
  _count: { messages: number };
}

export interface MessageWithSender {
  id: string;
  body: string;
  createdAt: Date;
  senderId: string;
  sender: { id: string; name: string; role: string };
}

// ── Channel helpers ───────────────────────────────────────────────────────────

/**
 * Get or create a channel. Used to lazily provision channels on first access.
 */
export async function getOrCreateChannel(
  cohortId: string,
  trackId: string | null,
  name: string
) {
  const existing = await db.channel.findUnique({
    where: { cohortId_trackId: { cohortId, trackId: trackId ?? "" } },
  });
  if (existing) return existing;

  return db.channel.create({ data: { cohortId, trackId, name } });
}

/**
 * Returns the channels a student can access:
 *   1. general cohort channel  (trackId = null)
 *   2. their track channel
 */
export async function getStudentChannels(userId: string): Promise<ChannelWithMeta[]> {
  const enrollment = await db.enrollment.findFirst({
    where: { userId },
    include: { track: { select: { id: true, name: true, cohortId: true } } },
  });
  if (!enrollment) return [];

  const { cohortId } = enrollment.track;

  // Ensure both channels exist
  await getOrCreateChannel(cohortId, null, "General");
  await getOrCreateChannel(cohortId, enrollment.trackId, enrollment.track.name);

  return db.channel.findMany({
    where: {
      cohortId,
      OR: [{ trackId: null }, { trackId: enrollment.trackId }],
    },
    include: { _count: { select: { messages: true } } },
    orderBy: { trackId: "asc" },
  });
}

/**
 * Returns channels an instructor can access (general + assigned tracks).
 */
export async function getInstructorChannels(userId: string): Promise<ChannelWithMeta[]> {
  const assignments = await db.trackInstructor.findMany({
    where: { userId },
    include: { track: { select: { id: true, name: true, cohortId: true } } },
  });
  if (!assignments.length) return [];

  const cohortIds = [...new Set(assignments.map((a) => a.track.cohortId))];

  // Ensure channels exist
  for (const a of assignments) {
    await getOrCreateChannel(a.track.cohortId, null, "General");
    await getOrCreateChannel(a.track.cohortId, a.trackId, a.track.name);
  }

  return db.channel.findMany({
    where: {
      cohortId: { in: cohortIds },
      OR: [{ trackId: null }, { trackId: { in: assignments.map((a) => a.trackId) } }],
    },
    include: { _count: { select: { messages: true } } },
    orderBy: [{ cohortId: "asc" }, { trackId: "asc" }],
  });
}

/**
 * Returns ALL channels (admin use).
 */
export async function getAllChannels(): Promise<ChannelWithMeta[]> {
  return db.channel.findMany({
    include: { _count: { select: { messages: true } } },
    orderBy: [{ cohortId: "asc" }, { trackId: "asc" }],
  });
}

// ── Message helpers ───────────────────────────────────────────────────────────

export async function getChannelMessages(
  channelId: string,
  limit = 100
): Promise<MessageWithSender[]> {
  const rows = await db.message.findMany({
    where: { channelId, deleted: false },
    orderBy: { createdAt: "asc" },
    take: limit,
    include: { sender: { select: { id: true, name: true, role: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    body: r.body,
    createdAt: r.createdAt,
    senderId: r.senderId,
    sender: r.sender,
  }));
}

export async function createMessage(
  channelId: string,
  senderId: string,
  body: string
) {
  return db.message.create({ data: { channelId, senderId, body } });
}

export async function softDeleteMessage(messageId: string) {
  return db.message.update({ where: { id: messageId }, data: { deleted: true } });
}

export async function getMessageById(messageId: string) {
  return db.message.findUnique({
    where: { id: messageId },
    include: { channel: true },
  });
}

// ── Mute helpers ──────────────────────────────────────────────────────────────

/**
 * Returns true if userId is currently muted in the given channel's scope.
 */
export async function isUserMuted(
  userId: string,
  cohortId: string,
  trackId: string | null
): Promise<boolean> {
  const now = new Date();
  const mute = await db.chatMute.findFirst({
    where: {
      userId,
      cohortId,
      AND: [
        { OR: [{ trackId: null }, { trackId: trackId ?? undefined }] },
        { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
      ],
    },
  });
  return !!mute;
}

export async function muteUser(
  userId: string,
  cohortId: string,
  trackId: string | null,
  mutedById: string,
  reason?: string,
  expiresAt?: Date
) {
  return db.chatMute.create({
    data: { userId, cohortId, trackId, mutedById, reason, expiresAt },
  });
}

export async function unmuteUser(
  userId: string,
  cohortId: string
) {
  return db.chatMute.deleteMany({ where: { userId, cohortId } });
}

export async function getMutesForCohort(cohortId: string) {
  const now = new Date();
  return db.chatMute.findMany({
    where: {
      cohortId,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      mutedBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

// ── Access guards ─────────────────────────────────────────────────────────────

/**
 * Verify that a channel is accessible to the given user.
 * Returns the channel or null if access is denied.
 */
export async function getChannelIfAuthorized(
  channelId: string,
  userId: string,
  role: string
) {
  const channel = await db.channel.findUnique({ where: { id: channelId } });
  if (!channel) return null;
  if (role === "ADMIN") return channel;

  if (role === "INSTRUCTOR") {
    const assignment = await db.trackInstructor.findFirst({ where: { userId } });
    if (!assignment) return null;
    const trackIds = (
      await db.trackInstructor.findMany({ where: { userId }, select: { trackId: true } })
    ).map((a) => a.trackId);
    const cohortIds = (
      await db.track.findMany({ where: { id: { in: trackIds } }, select: { cohortId: true } })
    ).map((t) => t.cohortId);
    if (!cohortIds.includes(channel.cohortId)) return null;
    if (channel.trackId && !trackIds.includes(channel.trackId)) return null;
    return channel;
  }

  // Student
  const enrollment = await db.enrollment.findFirst({
    where: { userId },
    include: { track: { select: { cohortId: true } } },
  });
  if (!enrollment) return null;
  if (enrollment.track.cohortId !== channel.cohortId) return null;
  if (channel.trackId && channel.trackId !== enrollment.trackId) return null;
  return channel;
}

import { Role } from "@prisma/client";
import { db } from "@/lib/db";

export interface AnnouncementItem {
  id: string;
  cohortId: string;
  trackId: string | null;
  trackName: string | null;
  cohortName: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  title: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  canManage: boolean;
}

/**
 * Retrieves all announcements visible to the current authenticated user:
 * - ADMIN: can see all announcements across tracks & cohorts
 * - INSTRUCTOR: can see announcements for assigned tracks + cohort-wide shared
 * - STUDENT: can see announcements for enrolled track + cohort-wide shared
 */
export async function getAnnouncements(
  userId: string,
  role: Role,
  filterTrackId?: string
): Promise<AnnouncementItem[]> {
  const where: Record<string, unknown> = {};

  if (role === Role.STUDENT) {
    const enrollment = await db.enrollment.findFirst({
      where: { userId },
      include: { track: true },
    });

    if (!enrollment) {
      return [];
    }

    where.cohortId = enrollment.track.cohortId;
    where.OR = [
      { trackId: enrollment.trackId },
      { trackId: null },
    ];
  } else if (role === Role.INSTRUCTOR) {
    const assignments = await db.trackInstructor.findMany({
      where: { userId },
      select: { trackId: true },
    });

    const assignedTrackIds = assignments.map((a) => a.trackId);
    if (assignedTrackIds.length === 0) {
      return [];
    }

    if (filterTrackId && filterTrackId !== "all") {
      where.trackId = filterTrackId === "shared" ? null : filterTrackId;
    } else {
      where.OR = [
        { trackId: { in: assignedTrackIds } },
        { trackId: null },
      ];
    }
  } else if (role === Role.ADMIN) {
    if (filterTrackId && filterTrackId !== "all") {
      where.trackId = filterTrackId === "shared" ? null : filterTrackId;
    }
  }

  const announcements = await db.announcement.findMany({
    where,
    include: {
      track: { select: { id: true, name: true } },
      cohort: { select: { id: true, name: true } },
      author: { select: { id: true, name: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return announcements.map((ann) => ({
    id: ann.id,
    cohortId: ann.cohortId,
    trackId: ann.trackId,
    trackName: ann.track ? ann.track.name : null,
    cohortName: ann.cohort.name,
    authorId: ann.authorId,
    authorName: ann.author.name,
    authorRole: ann.author.role,
    title: ann.title,
    body: ann.body,
    createdAt: new Date(ann.createdAt),
    updatedAt: new Date(ann.updatedAt),
    canManage:
      role === Role.ADMIN ||
      (role === Role.INSTRUCTOR && ann.authorId === userId),
  }));
}

/**
 * Retrieves a single announcement by ID with authorization check.
 */
export async function getAnnouncementById(
  id: string,
  userId: string,
  role: Role
): Promise<AnnouncementItem | null> {
  const ann = await db.announcement.findUnique({
    where: { id },
    include: {
      track: { select: { id: true, name: true } },
      cohort: { select: { id: true, name: true } },
      author: { select: { id: true, name: true, role: true } },
    },
  });

  if (!ann) return null;

  if (role === Role.STUDENT) {
    const enrollment = await db.enrollment.findFirst({
      where: { userId },
      include: { track: true },
    });
    if (!enrollment) return null;
    if (ann.trackId && ann.trackId !== enrollment.trackId) return null;
    if (ann.cohortId !== enrollment.track.cohortId) return null;
  } else if (role === Role.INSTRUCTOR) {
    const assignments = await db.trackInstructor.findMany({
      where: { userId },
      select: { trackId: true },
    });
    const assignedTrackIds = assignments.map((a) => a.trackId);
    if (ann.trackId && !assignedTrackIds.includes(ann.trackId)) return null;
  }

  return {
    id: ann.id,
    cohortId: ann.cohortId,
    trackId: ann.trackId,
    trackName: ann.track ? ann.track.name : null,
    cohortName: ann.cohort.name,
    authorId: ann.authorId,
    authorName: ann.author.name,
    authorRole: ann.author.role,
    title: ann.title,
    body: ann.body,
    createdAt: new Date(ann.createdAt),
    updatedAt: new Date(ann.updatedAt),
    canManage:
      role === Role.ADMIN ||
      (role === Role.INSTRUCTOR && ann.authorId === userId),
  };
}

/**
 * Creates an announcement directly in PostgreSQL.
 */
export async function createAnnouncement(
  cohortIdOrData:
    | string
    | {
        title: string;
        body: string;
        cohortId: string;
        trackId: string | null;
      },
  trackIdOrAuthorId?: string | null,
  titleOrRole?: string | Role,
  bodyArg?: string,
  authorIdArg?: string,
  roleArg?: Role
): Promise<AnnouncementItem> {
  let cohortId: string;
  let trackId: string | null;
  let title: string;
  let body: string;
  let authorId: string;
  let role: Role;

  if (typeof cohortIdOrData === "object" && cohortIdOrData !== null) {
    cohortId = cohortIdOrData.cohortId;
    trackId = cohortIdOrData.trackId;
    title = cohortIdOrData.title;
    body = cohortIdOrData.body;
    authorId = trackIdOrAuthorId as string;
    role = titleOrRole as Role;
  } else {
    cohortId = cohortIdOrData;
    trackId = trackIdOrAuthorId ?? null;
    title = titleOrRole as string;
    body = bodyArg!;
    authorId = authorIdArg!;
    role = roleArg!;
  }

  if (role === Role.STUDENT) {
    throw new Error("Students are not permitted to publish announcements.");
  }

  if (role === Role.INSTRUCTOR && trackId !== null) {
    const assignment = await db.trackInstructor.findUnique({
      where: {
        trackId_userId: {
          trackId,
          userId: authorId,
        },
      },
    });
    if (!assignment) {
      throw new Error("You are not authorized to post announcements for this track.");
    }
  }

  const created = await db.announcement.create({
    data: {
      cohortId,
      trackId,
      authorId,
      title: title.trim(),
      body: body.trim(),
    },
    include: {
      track: { select: { id: true, name: true } },
      cohort: { select: { id: true, name: true } },
      author: { select: { id: true, name: true, role: true } },
    },
  });

  return {
    id: created.id,
    cohortId: created.cohortId,
    trackId: created.trackId,
    trackName: created.track ? created.track.name : null,
    cohortName: created.cohort.name,
    authorId: created.authorId,
    authorName: created.author.name,
    authorRole: created.author.role,
    title: created.title,
    body: created.body,
    createdAt: new Date(created.createdAt),
    updatedAt: new Date(created.updatedAt),
    canManage: true,
  };
}

/**
 * Updates an announcement directly in PostgreSQL.
 */
export async function updateAnnouncement(
  id: string,
  input: {
    trackId?: string | null;
    title?: string;
    body?: string;
  },
  userId: string,
  role: Role
): Promise<AnnouncementItem> {
  const existing = await getAnnouncementById(id, userId, role);
  if (!existing) {
    throw new Error("Announcement not found");
  }

  if (!existing.canManage && role !== Role.ADMIN) {
    throw new Error("You are not authorized to edit this announcement");
  }

  const title = input.title !== undefined ? input.title.trim() : existing.title;
  const body = input.body !== undefined ? input.body.trim() : existing.body;
  const trackId = input.trackId !== undefined ? input.trackId : existing.trackId;

  if (!title) throw new Error("Title cannot be empty");
  if (!body) throw new Error("Body cannot be empty");

  const updated = await db.announcement.update({
    where: { id },
    data: {
      title,
      body,
      trackId,
    },
    include: {
      track: { select: { id: true, name: true } },
      cohort: { select: { id: true, name: true } },
      author: { select: { id: true, name: true, role: true } },
    },
  });

  return {
    id: updated.id,
    cohortId: updated.cohortId,
    trackId: updated.trackId,
    trackName: updated.track ? updated.track.name : null,
    cohortName: updated.cohort.name,
    authorId: updated.authorId,
    authorName: updated.author.name,
    authorRole: updated.author.role,
    title: updated.title,
    body: updated.body,
    createdAt: new Date(updated.createdAt),
    updatedAt: new Date(updated.updatedAt),
    canManage: true,
  };
}

/**
 * Deletes an announcement directly in PostgreSQL.
 */
export async function deleteAnnouncement(
  id: string,
  userId: string,
  role: Role
): Promise<void> {
  const existing = await getAnnouncementById(id, userId, role);
  if (!existing) {
    throw new Error("Announcement not found");
  }

  if (!existing.canManage && role !== Role.ADMIN) {
    throw new Error("You are not authorized to delete this announcement");
  }

  await db.announcement.delete({
    where: { id },
  });
}

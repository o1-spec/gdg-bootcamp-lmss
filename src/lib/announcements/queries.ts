import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { mockTracks, mockCohorts } from "@/lib/mock-data";

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

// In-memory fallback store for local development when DB is offline
const fallbackAnnouncements: Array<{
  id: string;
  cohortId: string;
  trackId: string | null;
  authorId: string;
  authorName: string;
  authorRole: string;
  title: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}> = [
  {
    id: "ann-001",
    cohortId: "coh-2026-1",
    trackId: null, // Cohort-wide
    authorId: "usr-admin-01",
    authorName: "System Admin",
    authorRole: "ADMIN",
    title: "Midterm Capstone Guidelines & System Design Masterclass",
    body: "All cohort students: please review the milestone roadmap and technical interview rubric ahead of Friday's combined all-hands session. Attendance will be recorded.",
    createdAt: new Date("2026-03-24T10:00:00Z"),
    updatedAt: new Date("2026-03-24T10:00:00Z"),
  },
  {
    id: "ann-002",
    cohortId: "coh-2026-1",
    trackId: "trk-intermediate",
    authorId: "inst-001",
    authorName: "Sarah Jenkins",
    authorRole: "INSTRUCTOR",
    title: "Sliding Window Live Code-Along & Breakout Rooms",
    body: "For today's session, clone the starter repo and ensure your local runner is ready. We will work in pairs on dynamic window contraction and edge-case testing.",
    createdAt: new Date("2026-03-23T14:30:00Z"),
    updatedAt: new Date("2026-03-23T14:30:00Z"),
  },
  {
    id: "ann-003",
    cohortId: "coh-2026-1",
    trackId: "trk-foundations",
    authorId: "inst-002",
    authorName: "Marcus Vance",
    authorRole: "INSTRUCTOR",
    title: "Foundations Track: Hash Map Collision Lab Available",
    body: "Problem set 3 has been posted to your assignments dashboard. Please ensure you implement both linear probing and separate chaining before Wednesday.",
    createdAt: new Date("2026-03-22T09:15:00Z"),
    updatedAt: new Date("2026-03-22T09:15:00Z"),
  },
];

/**
 * Fetch announcements scoped strictly to the user's role and track/cohort access.
 */
export async function getAnnouncements(
  userId: string,
  role: Role,
  cohortId?: string
): Promise<AnnouncementItem[]> {
  try {
    let whereClause: Record<string, unknown> = {};

    if (role === Role.STUDENT) {
      const enrollment = await db.enrollment.findFirst({
        where: { userId },
        include: { track: true },
      });

      if (!enrollment) {
        return [];
      }

      whereClause = {
        cohortId: enrollment.track.cohortId,
        OR: [{ trackId: enrollment.trackId }, { trackId: null }],
      };
    } else if (role === Role.INSTRUCTOR) {
      const assignedTracks = await db.trackInstructor.findMany({
        where: { userId },
        include: { track: true },
      });

      if (assignedTracks.length === 0) {
        return [];
      }

      const assignedTrackIds = assignedTracks.map((t) => t.trackId);
      const assignedCohortIds = Array.from(
        new Set(assignedTracks.map((t) => t.track.cohortId))
      );

      whereClause = {
        OR: [
          { trackId: { in: assignedTrackIds } },
          {
            cohortId: { in: assignedCohortIds },
            trackId: null,
          },
        ],
      };
    } else if (role === Role.ADMIN) {
      if (cohortId) {
        whereClause = { cohortId };
      }
    }

    const announcements = await db.announcement.findMany({
      where: whereClause,
      include: {
        track: { select: { id: true, name: true } },
        cohort: { select: { id: true, name: true } },
        author: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return announcements.map((ann) => {
      const canManage =
        role === Role.ADMIN ||
        (role === Role.INSTRUCTOR &&
          (ann.authorId === userId ||
            (ann.trackId !== null &&
              Boolean(ann.track && ann.authorId === userId))));

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
        canManage,
      };
    });
  } catch (err) {
    console.warn("Database query failed in getAnnouncements, using fallback memory store:", err);

    let filtered = [...fallbackAnnouncements];

    if (role === Role.STUDENT) {
      const studentTrackId = "trk-intermediate";
      const studentCohortId = "coh-2026-1";
      filtered = filtered.filter(
        (a) =>
          a.cohortId === studentCohortId &&
          (a.trackId === studentTrackId || a.trackId === null)
      );
    } else if (role === Role.INSTRUCTOR) {
      const instructorTrackId = "trk-intermediate";
      filtered = filtered.filter(
        (a) => a.trackId === instructorTrackId || a.trackId === null
      );
    }

    return filtered.map((ann) => {
      const track = mockTracks.find((t) => t.id === ann.trackId);
      const cohort = mockCohorts.find((c) => c.id === ann.cohortId);

      const canManage =
        role === Role.ADMIN ||
        (role === Role.INSTRUCTOR && ann.authorId === userId);

      return {
        id: ann.id,
        cohortId: ann.cohortId,
        trackId: ann.trackId,
        trackName: track ? track.name : null,
        cohortName: cohort ? cohort.name : "DSA Bootcamp 2026",
        authorId: ann.authorId,
        authorName: ann.authorName,
        authorRole: ann.authorRole,
        title: ann.title,
        body: ann.body,
        createdAt: ann.createdAt,
        updatedAt: ann.updatedAt,
        canManage,
      };
    });
  }
}

/**
 * Fetch a single announcement by ID with authorization check.
 */
export async function getAnnouncementById(
  id: string,
  userId: string,
  role: Role
): Promise<AnnouncementItem | null> {
  const all = await getAnnouncements(userId, role);
  return all.find((a) => a.id === id) || null;
}

/**
 * Create a new announcement with server-side authorization check.
 */
export async function createAnnouncement(
  input: {
    cohortId: string;
    trackId?: string | null;
    title: string;
    body: string;
  },
  userId: string,
  role: Role
): Promise<AnnouncementItem> {
  if (role === Role.STUDENT) {
    throw new Error("Students are not authorized to post announcements");
  }

  const title = input.title?.trim();
  const body = input.body?.trim();
  const cohortId = input.cohortId?.trim();
  const trackId = input.trackId ? input.trackId.trim() : null;

  if (!title) throw new Error("Announcement title is required");
  if (!body) throw new Error("Announcement body is required");
  if (!cohortId) throw new Error("Cohort is required");

  // Validate instructor track authorization
  if (role === Role.INSTRUCTOR) {
    try {
      const assignedTracks = await db.trackInstructor.findMany({
        where: { userId },
        include: { track: true },
      });

      const assignedTrackIds = assignedTracks.map((t) => t.trackId);
      const assignedCohortIds = assignedTracks.map((t) => t.track.cohortId);

      if (trackId !== null && !assignedTrackIds.includes(trackId)) {
        throw new Error("You are not authorized to post to this track");
      }

      if (trackId === null && !assignedCohortIds.includes(cohortId)) {
        throw new Error("You are not authorized to post to this cohort");
      }
    } catch {
      // Fallback check
      if (trackId !== null && trackId !== "trk-intermediate") {
        throw new Error("You are not authorized to post to this track");
      }
    }
  }

  try {
    const created = await db.announcement.create({
      data: {
        cohortId,
        trackId,
        authorId: userId,
        title,
        body,
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
  } catch (err) {
    console.warn("DB createAnnouncement failed, saving to fallback store:", err);

    const newId = `ann-${Date.now()}`;
    const newRecord = {
      id: newId,
      cohortId,
      trackId,
      authorId: userId,
      authorName: role === Role.ADMIN ? "Administrator" : "Instructor",
      authorRole: role,
      title,
      body,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    fallbackAnnouncements.unshift(newRecord);

    const track = mockTracks.find((t) => t.id === trackId);
    const cohort = mockCohorts.find((c) => c.id === cohortId);

    return {
      ...newRecord,
      trackName: track ? track.name : null,
      cohortName: cohort ? cohort.name : "DSA Bootcamp 2026",
      canManage: true,
    };
  }
}

/**
 * Update an announcement with server-side authorization check.
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

  try {
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
  } catch (err) {
    console.warn("DB updateAnnouncement failed, updating fallback store:", err);

    const idx = fallbackAnnouncements.findIndex((a) => a.id === id);
    if (idx !== -1) {
      fallbackAnnouncements[idx] = {
        ...fallbackAnnouncements[idx],
        title,
        body,
        trackId: trackId ?? null,
        updatedAt: new Date(),
      };
    }

    return {
      ...existing,
      title,
      body,
      trackId: trackId ?? null,
      updatedAt: new Date(),
    };
  }
}

/**
 * Delete an announcement with server-side authorization check.
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

  try {
    await db.announcement.delete({
      where: { id },
    });
  } catch (err) {
    console.warn("DB deleteAnnouncement failed, deleting from fallback store:", err);
    const idx = fallbackAnnouncements.findIndex((a) => a.id === id);
    if (idx !== -1) {
      fallbackAnnouncements.splice(idx, 1);
    }
  }
}

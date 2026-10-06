/*
|--------------------------------------------------
| custom imports
|--------------------------------------------------
*/
import { db } from "@/lib/db";

/*
|----------------------------------------------------------------------------------------------------
| notifyAssignmentCreated
|----------------------------------------------------------------------------------------------------
| Create notifications for all students enrolled in the given cohort/track when a new assignment is published.
*/
export async function notifyAssignmentCreated(
  assignmentId: string,
  cohortId: string,
  trackId: string | null,
  title: string
) {
  const enrollments = await db.enrollment.findMany({
    where: { track: { cohortId }, ...(trackId ? { trackId } : {}) },
    select: { userId: true },
  });
  if (!enrollments.length) return;

  await db.notification.createMany({
    data: enrollments.map((e) => ({
      userId: e.userId,
      type: "ASSIGNMENT",
      title: "New assignment posted",
      body: title,
      link: "/assignments",
    })),
    skipDuplicates: true,
  });
}

/*
|----------------------------------------------------------------------------------------------------
| notifyGradeReleased
|----------------------------------------------------------------------------------------------------
| Create a notification for the student whose grade was released.
*/
export async function notifyGradeReleased(
  submissionId: string,
  studentId: string,
  assignmentTitle: string
) {
  await db.notification.create({
    data: {
      userId: studentId,
      type: "GRADE_RELEASED",
      title: "Grade released",
      body: `Your grade for "${assignmentTitle}" is now available.`,
      link: `/assignments`,
    },
  });
}

/*
|----------------------------------------------------------------------------------------------------
| notifyAnnouncement
|----------------------------------------------------------------------------------------------------
| Create notifications for all students in the cohort/track when an announcement is posted.
*/
export async function notifyAnnouncement(
  cohortId: string,
  trackId: string | null,
  announcementTitle: string
) {
  const enrollments = await db.enrollment.findMany({
    where: { track: { cohortId }, ...(trackId ? { trackId } : {}) },
    select: { userId: true },
  });
  if (!enrollments.length) return;

  await db.notification.createMany({
    data: enrollments.map((e) => ({
      userId: e.userId,
      type: "ANNOUNCEMENT",
      title: "New announcement",
      body: announcementTitle,
      link: "/announcements",
    })),
    skipDuplicates: true,
  });
}

/*
|----------------------------------------------------------------------------------------------------
| getUserNotifications
|----------------------------------------------------------------------------------------------------
| Retrieves User Notifications data from the database.
*/
export async function getUserNotifications(userId: string, limit = 50) {
  return db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/*
|----------------------------------------------------------------------------------------------------
| getUnreadCount
|----------------------------------------------------------------------------------------------------
| Retrieves Unread Count data from the database.
*/
export async function getUnreadCount(userId: string): Promise<number> {
  return db.notification.count({ where: { userId, readAt: null } });
}

/*
|----------------------------------------------------------------------------------------------------
| markNotificationRead
|----------------------------------------------------------------------------------------------------
| Handler implementation for mark Notification Read.
*/
export async function markNotificationRead(notificationId: string, userId: string) {
  return db.notification.updateMany({
    where: { id: notificationId, userId },
    data: { readAt: new Date() },
  });
}

/*
|----------------------------------------------------------------------------------------------------
| markAllRead
|----------------------------------------------------------------------------------------------------
| Handler implementation for mark All Read.
*/
export async function markAllRead(userId: string) {
  return db.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}

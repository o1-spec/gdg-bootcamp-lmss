"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { createSession, updateSession, deleteSession } from "./queries";

function isValidUrl(stringUrl: string): boolean {
  try {
    const url = new URL(stringUrl);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function createSessionAction(formData: FormData) {
  const user = await requireUser();

  const title = formData.get("title")?.toString().trim();
  const description = formData.get("description")?.toString().trim() || undefined;
  const cohortId = formData.get("cohortId")?.toString().trim();
  const isShared = formData.get("isShared") === "true" || formData.get("isShared") === "on";
  const trackIdRaw = formData.get("trackId")?.toString().trim();
  const trackId = isShared || !trackIdRaw ? null : trackIdRaw;

  const dateStr = formData.get("date")?.toString().trim();
  const startTimeStr = formData.get("startTime")?.toString().trim();
  const endTimeStr = formData.get("endTime")?.toString().trim();

  const meetingUrl = formData.get("meetingUrl")?.toString().trim() || undefined;
  const recordingUrl = formData.get("recordingUrl")?.toString().trim() || undefined;
  const notes = formData.get("notes")?.toString().trim() || undefined;

  // Form Validation
  if (!title) {
    throw new Error("Title is required.");
  }
  if (!cohortId) {
    throw new Error("Cohort is required.");
  }
  if (!isShared && !trackId) {
    throw new Error("Please select a track or mark the session as cohort-wide shared.");
  }
  if (!dateStr || !startTimeStr || !endTimeStr) {
    throw new Error("Date, start time, and end time are required.");
  }

  const startsAt = new Date(`${dateStr}T${startTimeStr}:00`);
  const endsAt = new Date(`${dateStr}T${endTimeStr}:00`);

  if (isNaN(startsAt.getTime()) || isNaN(endsAt.getTime())) {
    throw new Error("Invalid date or time entered.");
  }

  if (endsAt <= startsAt) {
    throw new Error("End time must be after start time.");
  }

  if (meetingUrl && !isValidUrl(meetingUrl)) {
    throw new Error("Meeting URL must be a valid http or https web address.");
  }

  if (recordingUrl && !isValidUrl(recordingUrl)) {
    throw new Error("Recording URL must be a valid http or https web address.");
  }

  await createSession(
    {
      cohortId,
      trackId,
      title,
      description,
      startsAt,
      endsAt,
      meetingUrl,
      recordingUrl,
      notes,
    },
    user.id,
    user.role
  );

  revalidatePath("/classes");
  revalidatePath("/instructor/classes");
  revalidatePath("/admin/classes");

  const targetUrl = user.role === "ADMIN" ? "/admin/classes" : "/instructor/classes";
  redirect(targetUrl);
}

export async function updateSessionAction(sessionId: string, formData: FormData) {
  const user = await requireUser();

  const title = formData.get("title")?.toString().trim();
  const description = formData.get("description")?.toString().trim() || undefined;
  const cohortId = formData.get("cohortId")?.toString().trim();
  const isShared = formData.get("isShared") === "true" || formData.get("isShared") === "on";
  const trackIdRaw = formData.get("trackId")?.toString().trim();
  const trackId = isShared || !trackIdRaw ? null : trackIdRaw;

  const dateStr = formData.get("date")?.toString().trim();
  const startTimeStr = formData.get("startTime")?.toString().trim();
  const endTimeStr = formData.get("endTime")?.toString().trim();

  const meetingUrl = formData.get("meetingUrl")?.toString().trim() || undefined;
  const recordingUrl = formData.get("recordingUrl")?.toString().trim() || undefined;
  const notes = formData.get("notes")?.toString().trim() || undefined;

  if (!title) {
    throw new Error("Title is required.");
  }
  if (!cohortId) {
    throw new Error("Cohort is required.");
  }
  if (!isShared && !trackId) {
    throw new Error("Please select a track or mark the session as cohort-wide shared.");
  }
  if (!dateStr || !startTimeStr || !endTimeStr) {
    throw new Error("Date, start time, and end time are required.");
  }

  const startsAt = new Date(`${dateStr}T${startTimeStr}:00`);
  const endsAt = new Date(`${dateStr}T${endTimeStr}:00`);

  if (isNaN(startsAt.getTime()) || isNaN(endsAt.getTime())) {
    throw new Error("Invalid date or time entered.");
  }

  if (endsAt <= startsAt) {
    throw new Error("End time must be after start time.");
  }

  if (meetingUrl && !isValidUrl(meetingUrl)) {
    throw new Error("Meeting URL must be a valid http or https web address.");
  }

  if (recordingUrl && !isValidUrl(recordingUrl)) {
    throw new Error("Recording URL must be a valid http or https web address.");
  }

  await updateSession(
    sessionId,
    {
      title,
      description,
      startsAt,
      endsAt,
      meetingUrl,
      recordingUrl,
      notes,
      cohortId,
      trackId,
    },
    user.id,
    user.role
  );

  revalidatePath("/classes");
  revalidatePath(`/classes/${sessionId}`);
  revalidatePath("/instructor/classes");
  revalidatePath(`/instructor/classes/${sessionId}`);
  revalidatePath("/admin/classes");
  revalidatePath(`/admin/classes/${sessionId}`);

  const targetUrl =
    user.role === "ADMIN"
      ? `/admin/classes/${sessionId}`
      : `/instructor/classes/${sessionId}`;
  redirect(targetUrl);
}

export async function deleteSessionAction(sessionId: string) {
  const user = await requireUser();

  await deleteSession(sessionId, user.id, user.role);

  revalidatePath("/classes");
  revalidatePath("/instructor/classes");
  revalidatePath("/admin/classes");

  const targetUrl = user.role === "ADMIN" ? "/admin/classes" : "/instructor/classes";
  redirect(targetUrl);
}

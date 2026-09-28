import { db } from "@/lib/db";
import crypto from "crypto";

/**
 * Generate a collision-resistant certificate code.
 * Format: BOOTCAMP-YYYY-XXXXXXXX (8 hex chars)
 */
function generateCode(): string {
  const year = new Date().getFullYear();
  const hex = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `BOOTCAMP-${year}-${hex}`;
}

/**
 * Issue a certificate for a student who has completed a track.
 * Idempotent — returns existing certificate if already issued.
 */
export async function issueCertificate(
  userId: string,
  trackId: string
): Promise<{ id: string; certificateCode: string; issuedAt: Date; isNew: boolean }> {
  // Check for existing
  const existing = await db.certificate.findUnique({
    where: { userId_trackId: { userId, trackId } },
  });
  if (existing) {
    return { ...existing, isNew: false };
  }

  // Get cohortId
  const track = await db.track.findUnique({
    where: { id: trackId },
    select: { cohortId: true },
  });
  if (!track) throw new Error("Track not found.");

  // Generate unique code (retry on collision — extremely unlikely)
  let code = generateCode();
  let attempts = 0;
  while (attempts < 5) {
    const clash = await db.certificate.findUnique({
      where: { certificateCode: code },
    });
    if (!clash) break;
    code = generateCode();
    attempts++;
  }

  const cert = await db.certificate.create({
    data: {
      userId,
      trackId,
      cohortId: track.cohortId,
      certificateCode: code,
    },
  });

  return { ...cert, isNew: true };
}

export async function getCertificate(userId: string, trackId: string) {
  return db.certificate.findUnique({
    where: { userId_trackId: { userId, trackId } },
    include: {
      user: { select: { name: true } },
      cohort: { select: { name: true } },
      track: { select: { name: true } },
    },
  });
}

export async function getCertificateByCode(code: string) {
  return db.certificate.findUnique({
    where: { certificateCode: code },
    include: {
      user: { select: { name: true } },
      cohort: { select: { name: true } },
      track: { select: { name: true } },
    },
  });
}

"use server";

import { requireUser } from "@/lib/auth/session";
import { issueCertificate } from "./queries";
import { getStudentCompletion } from "@/lib/completion/queries";
import { audit } from "@/lib/audit/logger";
import { db } from "@/lib/db";

export async function claimCertificateAction(
  trackId: string
): Promise<{ success: boolean; certificateCode?: string; error?: string }> {
  const user = await requireUser();
  if (user.role !== "STUDENT") return { success: false, error: "Only students can claim certificates." };

  // Verify enrollment
  const enrollment = await db.enrollment.findFirst({
    where: { userId: user.id, trackId },
  });
  if (!enrollment) return { success: false, error: "You are not enrolled in this track." };

  // Check completion
  const completion = await getStudentCompletion(user.id, trackId);
  if (completion.status !== "COMPLETED") {
    return {
      success: false,
      error: `You have not yet met all completion requirements: ${completion.unmetRequirements.join("; ")}`,
    };
  }

  // Issue (idempotent)
  const cert = await issueCertificate(user.id, trackId);

  if (cert.isNew) {
    audit(user.id, "CERTIFICATE_ISSUED", "Certificate", cert.id, {
      trackId,
      certificateCode: cert.certificateCode,
    });
  }

  return { success: true, certificateCode: cert.certificateCode };
}

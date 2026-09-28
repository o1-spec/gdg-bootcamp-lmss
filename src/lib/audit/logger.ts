import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export type AuditAction =
  | "ATTENDANCE_MARKED"
  | "ATTENDANCE_OVERRIDDEN"
  | "EXCUSE_SUBMITTED"
  | "EXCUSE_APPROVED"
  | "EXCUSE_REJECTED"
  | "GRADE_SAVED"
  | "GRADE_RELEASED"
  | "BULK_GRADES_RELEASED"
  | "ENROLLMENT_CREATED"
  | "ENROLLMENT_DELETED"
  | "CERTIFICATE_ISSUED"
  | "MUTE_ISSUED"
  | "MUTE_REMOVED"
  | "MESSAGE_DELETED"
  | "ATTENDANCE_IMPORT_APPLIED";

export async function audit(
  actorId: string,
  action: AuditAction,
  targetType: string,
  targetId: string,
  metadata?: Prisma.InputJsonValue
) {
  // Fire-and-forget — never block the main operation
  db.auditLog
    .create({
      data: {
        actorId,
        action,
        targetType,
        targetId,
        metadata: metadata ?? undefined,
      },
    })
    .catch(() => {
      // Intentionally silent — audit failure must never break user flows
    });
}

/*
|--------------------------------------------------
| npm imports
|--------------------------------------------------
*/
import type { Prisma } from "@prisma/client";

/*
|--------------------------------------------------
| custom imports
|--------------------------------------------------
*/
import { db } from "@/lib/db";

/*
|--------------------------------------------------
| types
|--------------------------------------------------
*/
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

/*
|----------------------------------------------------------------------------------------------------
| audit
|----------------------------------------------------------------------------------------------------
| Records an asynchronous audit trail entry without blocking the primary request flow.
*/
export async function audit(
  actorId: string,
  action: AuditAction,
  targetType: string,
  targetId: string,
  metadata?: Prisma.InputJsonValue
) {
  /*
  |--------------------------------------------------
  | database mutation — fire and forget
  |--------------------------------------------------
  */
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

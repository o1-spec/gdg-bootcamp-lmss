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
  | "ATTENDANCE_IMPORT_APPLIED"
  | "SESSION_UPDATED"
  | "SESSION_DELETED"
  | "CHECKIN_CODE_CHANGED";

/*
|----------------------------------------------------------------------------------------------------
| audit
|----------------------------------------------------------------------------------------------------
| Records an audit trail entry. Callers must await it so the write is not dropped.
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
  | database mutation — awaited so it survives serverless teardown;
  | a failure is logged but never breaks the user flow
  |--------------------------------------------------
  */
  try {
    await db.auditLog.create({
      data: {
        actorId,
        action,
        targetType,
        targetId,
        metadata: metadata ?? undefined,
      },
    });
  } catch (err) {
    console.error("[audit] failed to record", action, targetType, targetId, err);
  }
}

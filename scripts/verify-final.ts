import { db } from "../src/lib/db";
import { submitExcuse, reviewExcuse, getStudentExcuses, getInstructorExcuses, getAllExcuses } from "../src/lib/excuses/queries";
import { getStudentAttendance, markAttendance } from "../src/lib/attendance/queries";
import { parseAttendanceImport, applyAttendanceImport } from "../src/lib/attendance/import-actions";
import { getStudentCompletion, getTrackCompletion } from "../src/lib/completion/queries";
import { issueCertificate, getCertificateByCode } from "../src/lib/certificates/queries";
import { getAuditLogs } from "../src/lib/audit/queries";
import { audit } from "../src/lib/audit/logger";

let passed = 0;
let failed = 0;

function assert(condition: boolean, name: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${name}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${name}`);
    failed++;
  }
}

async function run() {
  console.log("==================================================");
  console.log("RUNNING FINAL POST-MVP SYSTEM VERIFICATION MATRIX");
  console.log("==================================================");

  // 1. Fetch test users
  const student = await db.user.findFirst({ where: { role: "STUDENT" } });
  const instructor = await db.user.findFirst({ where: { role: "INSTRUCTOR" } });
  const admin = await db.user.findFirst({ where: { role: "ADMIN" } });

  if (!student || !instructor || !admin) {
    throw new Error("Missing seeded test users (student, instructor, or admin).");
  }

  const enrollment = await db.enrollment.findFirst({
    where: { userId: student.id },
    include: { track: true },
  });
  if (!enrollment) throw new Error("Student has no enrollment.");

  const trackId = enrollment.trackId;
  const cohortId = enrollment.track.cohortId;

  // Find a past session in student's track
  let session = await db.session.findFirst({
    where: { trackId, endsAt: { lte: new Date() } },
  });
  if (!session) {
    session = await db.session.findFirst({
      where: { cohortId, trackId: null, endsAt: { lte: new Date() } },
    });
  }
  if (!session) {
    // If no session is past, use any session
    session = await db.session.findFirst({ where: { trackId } });
  }
  if (!session) throw new Error("No session found for test.");

  console.log(`\nTest context: Student=${student.email}, Instructor=${instructor.email}, Admin=${admin.email}`);
  console.log(`Session=${session.title} (${session.id})`);

  // ==========================================
  // TEST 1: Attendance Excuses & Approval Workflow
  // ==========================================
  console.log("\n[Test Suite 1: Attendance Excuses & Approval Workflow]");

  // Clean up any existing excuse for this session/student
  await db.attendanceExcuse.deleteMany({
    where: { sessionId: session.id, userId: student.id },
  });

  // Student submits excuse
  const excuse = await submitExcuse(
    student.id,
    session.id,
    "Medical appointment with doctor note available upon request."
  );
  assert(excuse.status === "PENDING", "Student can submit excuse (status is PENDING)");

  // Student edits pending excuse
  const updatedExcuse = await submitExcuse(
    student.id,
    session.id,
    "Updated: Severe dental emergency, was unable to attend class."
  );
  assert(
    updatedExcuse.reason.startsWith("Updated:"),
    "Student can update excuse while still PENDING"
  );

  // Instructor approves excuse
  const reviewed = await reviewExcuse(
    excuse.id,
    instructor.id,
    "APPROVED",
    "Excused due to medical emergency."
  );
  assert(reviewed.status === "APPROVED", "Instructor can approve student excuse");

  // Student attempts to alter approved excuse -> must throw
  let alterThrew = false;
  try {
    await submitExcuse(student.id, session.id, "Trying to edit after approval");
  } catch (e: any) {
    alterThrew = true;
  }
  assert(alterThrew, "Student cannot alter an approved/reviewed excuse");

  // Admin can override excuse decision
  const overridden = await reviewExcuse(
    excuse.id,
    admin.id,
    "REJECTED",
    "Admin audit override: insufficient documentation",
    true // allowOverride
  );
  assert(
    overridden.status === "REJECTED",
    "Admin can override excuse review decision"
  );

  // Admin re-approves for subsequent tests
  await reviewExcuse(
    excuse.id,
    admin.id,
    "APPROVED",
    "Valid medical excuse re-approved",
    true
  );

  // ==========================================
  // TEST 2: Attendance Formula & Excuse Exclusion
  // ==========================================
  console.log("\n[Test Suite 2: Attendance Formula & Excuse Exclusion]");

  const attSummary = await getStudentAttendance(student.id);
  console.log(`  Attendance Rate: ${attSummary.summary.attendanceRate}%`);
  console.log(`  Total Completed Sessions: ${attSummary.summary.totalCompletedSessions}`);
  console.log(`  Approved Excused Absences: ${attSummary.summary.approvedExcusedCount}`);
  console.log(`  Eligible Completed Denominator: ${attSummary.summary.totalCompletedEligible}`);

  assert(
    attSummary.summary.approvedExcusedCount >= 1,
    "Approved excuse is reflected in student attendance summary"
  );
  assert(
    attSummary.summary.totalCompletedEligible ===
      Math.max(0, attSummary.summary.totalCompletedSessions - attSummary.summary.approvedExcusedCount),
    "Denominator equals completed sessions MINUS approved excused absences"
  );

  // ==========================================
  // TEST 3: Attendance CSV Import Cross-Check
  // ==========================================
  console.log("\n[Test Suite 3: Meet/Zoom Attendance CSV Import]");

  const sampleCsv = `Name,Email,Join Time,Leave Time
${student.name},${student.email},10:02 AM,11:30 AM
Guest User,guest@unknown-domain.com,10:05 AM,10:50 AM`;

  // Parse upload step
  const parseRes = await parseAttendanceImport(session.id, sampleCsv, instructor);
  assert(parseRes.success, "Parse CSV action returns success");
  assert(
    parseRes.preview?.matched.length === 1 && parseRes.preview?.matched[0].userId === student.id,
    "CSV correctly matched enrolled student by email"
  );
  assert(
    parseRes.preview?.unmatched.length === 1 && parseRes.preview?.unmatched[0].email === "guest@unknown-domain.com",
    "CSV correctly identified guest/unmatched participant"
  );

  if (parseRes.importId) {
    // Apply confirmed import
    const applyRes = await applyAttendanceImport(parseRes.importId, [student.id], instructor);
    assert(applyRes.success && applyRes.updated === 1, "Applied confirmed import for matched student");

    // Verify database record has method IMPORT
    const attRec = await db.attendance.findUnique({
      where: { sessionId_userId: { sessionId: session.id, userId: student.id } },
    });
    assert(attRec?.status === "PRESENT" && attRec?.method === "IMPORT", "Attendance record is PRESENT with method IMPORT");
  }

  // ==========================================
  // TEST 4: Central Completion Policy & Query
  // ==========================================
  console.log("\n[Test Suite 4: Completion Status]");

  const completion = await getStudentCompletion(student.id, trackId);
  console.log(`  Completion Status: ${completion.status}`);
  console.log(`  Attendance Rate: ${completion.attendanceRate}%`);
  console.log(`  Assignments: ${completion.assignmentsSubmitted}/${completion.assignmentsTotal}`);
  console.log(`  Unmet Criteria: ${completion.unmetRequirements.join("; ") || "None"}`);

  assert(
    ["COMPLETED", "IN_PROGRESS", "NOT_COMPLETED"].includes(completion.status),
    "Completion status is valid enum value"
  );

  const trackComp = await getTrackCompletion(trackId);
  assert(
    trackComp.length > 0 && trackComp.some((t) => t.userId === student.id),
    "Track completion batch query successfully calculates for enrolled students"
  );

  // ==========================================
  // TEST 5: Certificates & Collision-Resistant ID
  // ==========================================
  console.log("\n[Test Suite 5: Certificates]");

  const cert = await issueCertificate(student.id, trackId);
  assert(cert.certificateCode.startsWith("BOOTCAMP-2026-"), "Certificate code format matches BOOTCAMP-YYYY-XXXXXXXX");
  assert(cert.certificateCode.length >= 17, "Certificate code has sufficient entropy");

  const fetchedCert = await getCertificateByCode(cert.certificateCode);
  assert(
    fetchedCert?.userId === student.id && fetchedCert?.trackId === trackId,
    "Certificate can be verified and retrieved by unique code"
  );

  // Idempotency check
  const secondCert = await issueCertificate(student.id, trackId);
  assert(
    secondCert.certificateCode === cert.certificateCode && secondCert.isNew === false,
    "Certificate issuance is idempotent (prevents duplicates)"
  );

  // ==========================================
  // TEST 6: Audit Logging
  // ==========================================
  console.log("\n[Test Suite 6: Audit Log]");

  // Emit a sample audit log
  await db.auditLog.create({
    data: {
      actorId: admin.id,
      action: "ATTENDANCE_OVERRIDDEN",
      targetType: "Attendance",
      targetId: session.id,
      metadata: { note: "Automated test verification" },
    },
  });

  const auditLogs = await getAuditLogs({ action: "ATTENDANCE_OVERRIDDEN" });
  assert(auditLogs.length > 0, "Audit logs can be queried and filtered by action");
  assert(
    auditLogs[0].actor.email === admin.email,
    "Audit log retains actor relational context"
  );

  console.log("\n==================================================");
  console.log(`FINAL RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  await db.$disconnect();
  if (failed > 0) process.exit(1);
}

run().catch((e) => {
  console.error("FATAL TEST ERROR:", e);
  process.exit(1);
});

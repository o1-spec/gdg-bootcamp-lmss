/*
|--------------------------------------------------
| custom imports
|--------------------------------------------------
*/
import { db } from "../src/lib/db";
import { Role } from "@prisma/client";
import { getSubmissionForGrading } from "../src/lib/assignments/queries";
import { getInstructorSessions } from "../src/lib/sessions/queries";
import { markAttendance } from "../src/lib/attendance/queries";
import { rateLimit } from "../src/lib/auth/rate-limit";

/*
|--------------------------------------------------
| states
|--------------------------------------------------
*/
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

async function throws(fn: () => Promise<unknown>): Promise<boolean> {
  try {
    await fn();
    return false;
  } catch {
    return true;
  }
}

/*
|----------------------------------------------------------------------------------------------------
| run
|----------------------------------------------------------------------------------------------------
| Role / track access checks against the seeded database. Read-only: every write is expected to be
| rejected, so nothing is changed. Run it with the same TypeScript runner as scripts/verify-final.ts.
*/
async function run() {
  console.log("ACCESS-CONTROL CHECKS");

  const admin = await db.user.findFirst({ where: { role: Role.ADMIN } });
  const instructor = await db.user.findFirst({
    where: { role: Role.INSTRUCTOR, trackAssignments: { some: {} } },
    include: { trackAssignments: true },
  });
  if (!admin || !instructor) throw new Error("Seed data missing (admin or instructor).");

  const taughtIds = instructor.trackAssignments.map((t) => t.trackId);
  const otherTrack = await db.track.findFirst({ where: { id: { notIn: taughtIds } } });

  // 1. Students can never reach the grading helper
  const anySubmission = await db.submission.findFirst();
  if (anySubmission) {
    const student = await db.user.findFirst({ where: { role: Role.STUDENT } });
    assert(
      (await getSubmissionForGrading(anySubmission.id, student!.id, Role.STUDENT)) === null,
      "student cannot load a submission for grading"
    );
  }

  // 2. Instructor cannot load another track's submission
  if (otherTrack) {
    const foreign = await db.submission.findFirst({
      where: {
        user: {
          enrollments: { some: { trackId: otherTrack.id } },
          NOT: { enrollments: { some: { trackId: { in: taughtIds } } } },
        },
      },
    });
    if (foreign) {
      assert(
        (await getSubmissionForGrading(foreign.id, instructor.id, Role.INSTRUCTOR)) === null,
        "instructor cannot load a submission from a track they do not teach"
      );
    }

    // 3. ?track= for an untaught track must not widen the result
    const result = await getInstructorSessions(instructor.id, otherTrack.id);
    const all = [...result.upcoming, ...result.past];
    assert(
      all.every((s) => s.trackId !== otherTrack.id),
      "track filter cannot expose an untaught track's sessions"
    );
  }

  // 4. Manual attendance targets must be enrolled students
  const session = await db.session.findFirst({ where: { trackId: { in: taughtIds } } });
  if (session) {
    assert(
      await throws(() => markAttendance(session.id, admin.id, "PRESENT", instructor.id, Role.INSTRUCTOR)),
      "cannot record attendance for a non-student"
    );
  }

  // 5. Rate limiter blocks after the limit
  let blocked = false;
  for (let i = 0; i < 12; i++) {
    if (!rateLimit("access-checks", 10, 60_000).ok) blocked = true;
  }
  assert(blocked, "rate limiter blocks after the configured limit");

  console.log(`\n${passed} passed, ${failed} failed`);
  await db.$disconnect();
  process.exit(failed ? 1 : 0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

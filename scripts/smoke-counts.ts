// scripts/smoke-counts.ts – read-only row count report
import { db } from "../src/lib/db";

async function main() {
  const [users, cohorts, tracks, enrollments, trackInstructors, sessions, attendance, assignments, submissions, announcements] =
    await Promise.all([
      db.user.count(),
      db.cohort.count(),
      db.track.count(),
      db.enrollment.count(),
      db.trackInstructor.count(),
      db.session.count(),
      db.attendance.count(),
      db.assignment.count(),
      db.submission.count(),
      db.announcement.count(),
    ]);

  const users_list = await db.user.findMany({ select: { email: true, role: true, name: true } });

  console.log("\n=== ROW COUNTS ===");
  console.log(`User:            ${users}`);
  console.log(`Cohort:          ${cohorts}`);
  console.log(`Track:           ${tracks}`);
  console.log(`Enrollment:      ${enrollments}`);
  console.log(`TrackInstructor: ${trackInstructors}`);
  console.log(`Session:         ${sessions}`);
  console.log(`Attendance:      ${attendance}`);
  console.log(`Assignment:      ${assignments}`);
  console.log(`Submission:      ${submissions}`);
  console.log(`Announcement:    ${announcements}`);

  console.log("\n=== SEEDED ACCOUNTS ===");
  for (const u of users_list) {
    console.log(`  [${u.role.padEnd(10)}] ${u.email}  (${u.name})`);
  }
  await db.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });

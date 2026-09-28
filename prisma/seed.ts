// prisma/seed.ts
// Seed script for Bootcamp LMS database initialization
// NOTE: Development passwords used here ("Password123!") are for local testing ONLY.

import { PrismaClient, Role, AttendanceStatus, AttendanceMethod } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEV_SEED_PASSWORD = "Password123!";

async function main() {
  console.log("Seeding Bootcamp LMS database with development data...");

  const passwordHash = await bcrypt.hash(DEV_SEED_PASSWORD, 10);

  // 1. Cohort
  const cohort = await prisma.cohort.create({
    data: {
      name: "DSA Bootcamp 2026",
      startDate: new Date("2026-01-15T00:00:00.000Z"),
      endDate: new Date("2026-05-15T00:00:00.000Z"),
    },
  });

  // 2. Tracks
  const trackFoundations = await prisma.track.create({
    data: {
      cohortId: cohort.id,
      name: "Foundations",
      description: "Core algorithms, Big-O, Hash Maps, Strings, and Two-Pointers.",
    },
  });

  const trackIntermediate = await prisma.track.create({
    data: {
      cohortId: cohort.id,
      name: "Intermediate",
      description: "Sliding Window, Binary Search, Trees, Graphs, and Heaps.",
    },
  });

  const trackAdvanced = await prisma.track.create({
    data: {
      cohortId: cohort.id,
      name: "Advanced",
      description: "Dynamic Programming, Graph Shortest Paths, and Advanced Tries.",
    },
  });

  // 3. Admin Account
  const adminUser = await prisma.user.create({
    data: {
      name: "Super Admin",
      email: "admin@example.com",
      passwordHash,
      role: Role.ADMIN,
    },
  });

  // 4. Instructors (including instructor@example.com)
  const instructorSarah = await prisma.user.create({
    data: {
      name: "Sarah Jenkins",
      email: "instructor@example.com",
      passwordHash,
      role: Role.INSTRUCTOR,
    },
  });

  const instructorMarcus = await prisma.user.create({
    data: {
      name: "Marcus Vance",
      email: "marcus@bootcamp.edu",
      passwordHash,
      role: Role.INSTRUCTOR,
    },
  });

  const instructorDevon = await prisma.user.create({
    data: {
      name: "Devon Reed",
      email: "devon@bootcamp.edu",
      passwordHash,
      role: Role.INSTRUCTOR,
    },
  });

  // Assign instructors to tracks
  await prisma.trackInstructor.createMany({
    data: [
      { trackId: trackFoundations.id, userId: instructorMarcus.id },
      { trackId: trackIntermediate.id, userId: instructorSarah.id },
      { trackId: trackAdvanced.id, userId: instructorDevon.id },
    ],
  });

  // 5. Students (including student@example.com)
  const studentMain = await prisma.user.create({
    data: {
      name: "Alex Morgan",
      email: "student@example.com",
      passwordHash,
      role: Role.STUDENT,
    },
  });

  const students = await Promise.all([
    prisma.user.create({
      data: {
        name: "Elena Rostova",
        email: "elena.r@bootcamp.edu",
        passwordHash,
        role: Role.STUDENT,
      },
    }),
    prisma.user.create({
      data: {
        name: "Jordan Lee",
        email: "jordan.lee@bootcamp.edu",
        passwordHash,
        role: Role.STUDENT,
      },
    }),
    prisma.user.create({
      data: {
        name: "Tariq Mansour",
        email: "tariq.m@bootcamp.edu",
        passwordHash,
        role: Role.STUDENT,
      },
    }),
    prisma.user.create({
      data: {
        name: "Priya Sharma",
        email: "priya.s@bootcamp.edu",
        passwordHash,
        role: Role.STUDENT,
      },
    }),
    prisma.user.create({
      data: {
        name: "Carlos Mendez",
        email: "carlos.m@bootcamp.edu",
        passwordHash,
        role: Role.STUDENT,
      },
    }),
  ]);

  // 6. Enrollments across tracks
  await prisma.enrollment.createMany({
    data: [
      { userId: studentMain.id, trackId: trackIntermediate.id },
      { userId: students[0].id, trackId: trackIntermediate.id },
      { userId: students[1].id, trackId: trackIntermediate.id },
      { userId: students[2].id, trackId: trackFoundations.id },
      { userId: students[3].id, trackId: trackFoundations.id },
      { userId: students[4].id, trackId: trackAdvanced.id },
    ],
  });

  // 7. Sessions (Sample sessions: Sliding Window, Arrays & Hash Maps, Stacks & Queues, and Shared)
  const now = new Date();

  // Upcoming: Sliding Window (Intermediate Track)
  const session1 = await prisma.session.create({
    data: {
      cohortId: cohort.id,
      trackId: trackIntermediate.id,
      title: "Sliding Window & Two-Pointer Strategies",
      description: "Variable and dynamic sliding window patterns on arrays and strings.",
      startsAt: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
      endsAt: new Date(now.getTime() + 26 * 60 * 60 * 1000),
      meetingUrl: "https://meet.google.com/abc-defg-hij",
      recordingUrl: null,
      notes: "Please have your LeetCode runner and local code editor set up beforehand.",
      createdById: instructorSarah.id,
    },
  });

  // Upcoming: Arrays & Hash Maps (Foundations Track)
  await prisma.session.create({
    data: {
      cohortId: cohort.id,
      trackId: trackFoundations.id,
      title: "Arrays & Hash Maps: Collision Resolution & Fast Lookups",
      description: "Hash map internals, bucket chaining, and frequency counter technique.",
      startsAt: new Date(now.getTime() + 48 * 60 * 60 * 1000), // In 2 days
      endsAt: new Date(now.getTime() + 50 * 60 * 60 * 1000),
      meetingUrl: "https://meet.google.com/mno-pqrs-tuv",
      recordingUrl: null,
      notes: "Review standard ASCII table and hash table prime modulos.",
      createdById: instructorMarcus.id,
    },
  });

  // Past session with recording: Stacks & Queues
  await prisma.session.create({
    data: {
      cohortId: cohort.id,
      trackId: trackIntermediate.id,
      title: "Stacks & Queues: Monotonic Stacks & Deque Applications",
      description: "Deep dive into monotonic queue patterns, next greater element, and sliding window maximum.",
      startsAt: new Date(now.getTime() - 72 * 60 * 60 * 1000), // 3 days ago
      endsAt: new Date(now.getTime() - 70 * 60 * 60 * 1000),
      meetingUrl: "https://meet.google.com/xyz-past-meet",
      recordingUrl: "https://bootcamp-lms.example.com/recordings/stacks-queues.mp4",
      notes: "Complete slide deck and benchmark files linked in the discussion repo.",
      createdById: instructorSarah.id,
    },
  });

  // Shared session (Entire Cohort)
  await prisma.session.create({
    data: {
      cohortId: cohort.id,
      trackId: null, // Cohort-wide session
      title: "All-Hands: Technical Interviewing & System Communication",
      description: "Cohort-wide masterclass on framing algorithm trade-offs and time complexity communication.",
      startsAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // In 5 days
      endsAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000),
      meetingUrl: "https://meet.google.com/all-hands-meet",
      recordingUrl: null,
      notes: "Mandatory all-cohort session. Guest engineering panel.",
      createdById: adminUser.id,
    },
  });

  // 8. Attendance sample
  await prisma.attendance.create({
    data: {
      sessionId: session1.id,
      userId: studentMain.id,
      status: AttendanceStatus.PRESENT,
      method: AttendanceMethod.CHECK_IN,
      markedById: instructorSarah.id,
    },
  });

  // 9. Assignments & Submissions
  // Sample assignments: Two Sum Practice, Sliding Window Exercise, Stack Problems, Complexity Analysis (Shared)
  const asgTwoSum = await prisma.assignment.create({
    data: {
      cohortId: cohort.id,
      trackId: trackFoundations.id,
      title: "Two Sum Practice & Hash Map Lookup Optimization",
      description: "Implement two-sum with single-pass hash map and evaluate worst-case bucket collisions.",
      dueAt: new Date(now.getTime() - 48 * 60 * 60 * 1000), // 2 days ago
      maxScore: 100,
      allowLateSubmission: false,
      createdById: instructorMarcus.id,
    },
  });

  const asgSlidingWindow = await prisma.assignment.create({
    data: {
      cohortId: cohort.id,
      trackId: trackIntermediate.id,
      title: "Sliding Window Exercise: Max Subarray & Min Window",
      description: "Solve 3 medium LeetCode sliding window problems with O(n) runtime.",
      dueAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // In 2 days
      maxScore: 100,
      allowLateSubmission: true,
      createdById: instructorSarah.id,
    },
  });

  // Unsubmitted assignment
  await prisma.assignment.create({
    data: {
      cohortId: cohort.id,
      trackId: trackIntermediate.id,
      title: "Stack Problems: Monotonic Stack & Parentheses Matching",
      description: "Implement Next Greater Element and valid parentheses validation using stack data structures.",
      dueAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // In 5 days
      maxScore: 100,
      allowLateSubmission: true,
      createdById: instructorSarah.id,
    },
  });

  const asgShared = await prisma.assignment.create({
    data: {
      cohortId: cohort.id,
      trackId: null, // Cohort-wide assignment
      title: "Complexity Analysis Benchmark & Big-O Worksheet",
      description: "Derive tight asymptotic bounds for recursive divide-and-conquer routines.",
      dueAt: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1 day ago
      maxScore: 50,
      allowLateSubmission: true,
      createdById: instructorMarcus.id,
    },
  });

  // Submissions:
  // 1. Submitted but ungraded: Sliding Window by studentMain
  await prisma.submission.create({
    data: {
      assignmentId: asgSlidingWindow.id,
      userId: studentMain.id,
      submissionUrl: "https://github.com/alexmorgan/sliding-window-labs",
      submittedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      score: null,
      feedback: null,
      released: false,
    },
  });

  // 2. Graded but unreleased: Complexity Analysis by studentMain
  await prisma.submission.create({
    data: {
      assignmentId: asgShared.id,
      userId: studentMain.id,
      submissionUrl: "https://docs.google.com/document/d/1example-alex-worksheet",
      submittedAt: new Date(now.getTime() - 20 * 60 * 60 * 1000),
      score: 46,
      feedback: "Sound derivations for question 4. Please format asymptotic constants clearly.",
      gradedById: instructorSarah.id,
      gradedAt: new Date(now.getTime() - 10 * 60 * 60 * 1000),
      released: false, // PRIVACY: Unreleased!
    },
  });

  // 3. Graded and released: Two Sum Practice by Elena Rostova
  await prisma.submission.create({
    data: {
      assignmentId: asgTwoSum.id,
      userId: students[0].id,
      submissionUrl: "https://github.com/elena-r/hashmap-two-sum",
      submittedAt: new Date(now.getTime() - 50 * 60 * 60 * 1000),
      score: 98,
      feedback: "Outstanding efficiency analysis and clean pointer arithmetic. Perfect test suite.",
      gradedById: instructorMarcus.id,
      gradedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      released: true, // Released to student
    },
  });

  // 10. Announcements
  await prisma.announcement.create({
    data: {
      cohortId: cohort.id,
      trackId: null, // Cohort-wide
      authorId: adminUser.id,
      title: "Midterm Capstone Guidelines & System Design Masterclass",
      body: "All cohort students: please review the milestone roadmap and technical interview rubric ahead of Friday's combined all-hands.",
    },
  });

  await prisma.announcement.create({
    data: {
      cohortId: cohort.id,
      trackId: trackIntermediate.id,
      authorId: instructorSarah.id,
      title: "Sliding Window Live Code-Along & Breakout Rooms",
      body: "For today's session, clone the starter repo and ensure your local runner is ready. We will work in pairs on dynamic window contraction.",
    },
  });

  await prisma.announcement.create({
    data: {
      cohortId: cohort.id,
      trackId: trackFoundations.id,
      authorId: instructorMarcus.id,
      title: "Foundations Track: Hash Map Collision Lab Available",
      body: "Problem set 3 has been posted. Make sure to implement linear probing and separate chaining before Wednesday.",
    },
  });

  console.log("Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

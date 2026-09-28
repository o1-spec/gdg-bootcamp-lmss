export type UserRole = "student" | "instructor" | "admin";

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  initials: string;
  track: string;
  cohort: string;
  currentWeek: number;
  totalWeeks: number;
}

export interface Cohort {
  id: string;
  name: string;
  status: "Active" | "Upcoming" | "Completed";
  startDate: string;
  endDate: string;
  totalStudents: number;
  tracksCount: number;
}

export interface Track {
  id: string;
  name: string;
  cohortId: string;
  cohortName: string;
  description: string;
  instructorName: string;
  instructorEmail: string;
  studentsCount: number;
  sessionsCount: number;
  assignmentsCount: number;
  schedule: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  initials: string;
  trackId: string;
  trackName: string;
  cohortName: string;
  attendanceRate: number; // percentage
  assignmentsCompleted: number;
  totalAssignments: number;
  averageScore: number;
  status: "Active" | "At Risk" | "Completed";
}

export interface Instructor {
  id: string;
  name: string;
  email: string;
  initials: string;
  assignedTracks: string[];
  totalStudents: number;
  activeSessions: number;
  roleTitle: string;
}

export interface ClassSession {
  id: string;
  title: string;
  track: string;
  instructor: {
    name: string;
    role: string;
    avatarUrl?: string;
  };
  date: string;
  time: string;
  type: "Live Lecture" | "Workshop" | "Code Review" | "Lab Session";
  meetingUrl: string;
  recordingUrl?: string;
  isNext?: boolean;
}

export interface Assignment {
  id: string;
  title: string;
  track: string;
  dueDate: string;
  status: "graded" | "submitted" | "in_progress" | "pending";
  totalSubmissions?: number;
  gradedCount?: number;
  score?: number;
  maxScore?: number;
}

export interface Submission {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  studentId: string;
  studentName: string;
  trackName: string;
  submittedAt: string;
  status: "Graded" | "Awaiting Grading";
  score?: number;
  maxScore: number;
  feedback?: string;
}

export interface Announcement {
  id: string;
  title: string;
  track?: string;
  author: {
    name: string;
    role: string;
  };
  date: string;
  content: string;
  isPinned?: boolean;
}

export interface Enrollment {
  id: string;
  studentName: string;
  studentEmail: string;
  trackName: string;
  cohortName: string;
  enrolledDate: string;
  status: "Active" | "Pending" | "Withdrawn";
}

export interface ActivityItem {
  id: string;
  type: "enrollment" | "submission" | "session" | "announcement" | "grade";
  description: string;
  timestamp: string;
  targetRole?: string;
}

export interface DashboardSummary {
  attendancePercentage: number;
  attendedSessions: number;
  totalSessions: number;
  completedAssignments: number;
  totalAssignments: number;
  pendingReviewAssignments: number;
  averageScore: number;
}

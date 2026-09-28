# GDG Bootcamp LMS

A modern, lightweight, production-ready Learning Management System engineered specifically for intensive multi-track bootcamps (200+ students). Built from the ground up to replace fragmented spreadsheets, Google Forms, and manual tracking with a unified system of record.

---

## 🚀 Current Status & Active Work

The LMS has completed both the **MVP** and **Post-MVP** implementation milestones according to the original Product Requirements Document (PRD).

### 🛠️ What Is Currently Being Worked On / In Rollout:
- **Cloud Deployment**: Configuring production deployment on Vercel with transaction-mode PostgreSQL connection pooling (`pgbouncer`).
- **Direct File Storage**: Direct file submissions (ZIP, PDF, documents) integrated via Cloudinary with 25MB limits alongside repository URL submissions.
- **Attendance Policy Alignment**: Standardized on **Option A**:
  $$\text{Attendance Rate} = \frac{\text{Present} + \text{Late}}{\text{Completed Sessions} - \text{Approved Excuses}} \times 100$$
- **Database Reliability & Disaster Recovery**: Setting up automated daily snapshot backups and restore procedures on Supabase.

---

## 🌟 Key Features & Role Portals

### 🎓 1. Student Portal
- **Dashboard**: Track schedule, next class alerts, pending assignments, recent announcements, and attendance summary.
- **Live Sessions & Recordings**: Direct access to Google Meet/Zoom class sessions and past lecture recordings.
- **Attendance Check-In**: Quick 6-character check-in code validation during the active class window.
- **Absence Excuses**: Submit excuse requests for missed sessions with status tracking (`PENDING`, `APPROVED`, `REJECTED`).
- **Assignments & Submissions**: Submit work via external URLs (GitHub, Google Drive, Figma) or direct file uploads (ZIP, PDF).
- **Private Grades & Feedback**: Grades and detailed instructor feedback become visible only after explicit release.
- **Real-Time Progress**: View attendance percentage, completed assignments, average grade, and graduation status.
- **Certificates**: View and print/download verifiable completion certificates (`BOOTCAMP-YYYY-XXXXXXXX`).
- **Collaboration**: General cohort channel and track-specific chat channels with real-time polling.
- **Notifications**: In-app notifications for new assignments, grade releases, and announcements.

### 👨‍🏫 2. Instructor Portal
- **Track-Scoped Roster**: Instructors are restricted strictly to students enrolled in their assigned tracks.
- **Session Scheduling**: Create and manage classes, publish meeting links, upload recording links, and set session notes.
- **Attendance Management**: Generate 6-character check-in codes, manually mark/override attendance, and export attendance CSVs.
- **Meet/Zoom CSV Import**: Upload attendance export reports from Google Meet or Zoom, preview matched participants, and apply confirmed attendance.
- **Excuse Reviews**: Approve or reject student attendance excuses with custom review notes.
- **Assignments & Rubrics**: Create assignments with due dates, late submission rules, and multi-criteria grading rubrics.
- **Grading Queue & Bulk Release**: Evaluate submissions, assign criterion scores, write feedback, and release grades individually or in bulk.
- **Track Progress Monitoring**: Track attendance trends, submission rates, and automated "falling-behind" alerts.

### 🛡️ 3. Admin Console
- **Cohort & Track Management**: Full lifecycle management of bootcamp cohorts and academic tracks.
- **User & Enrollment Directory**: Manage student, instructor, and admin accounts; track student enrollment history.
- **Cross-Track Visibility**: Monitor sessions, attendance, and assignment grading backlogs across all tracks.
- **Global Excuse & Attendance Overrides**: Review or override excuse decisions across the entire platform.
- **Completion & Certificate Management**: Monitor cohort completion status and issue official completion certificates.
- **System Audit Log**: Comprehensive, multi-filter administrative audit viewer tracking sensitive actions (`ATTENDANCE_OVERRIDE`, `GRADE_RELEASED`, `EXCUSE_REVIEWED`, `CERTIFICATE_ISSUED`, `USER_MUTED`).

---

## 🏗️ Technology Stack

- **Framework**: [Next.js 16](https://nextjs.org) (App Router, Turbopack, Server Actions)
- **Language**: [TypeScript 5](https://www.typescriptlang.org)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com) (zero third-party UI libraries, native responsive design)
- **Database**: PostgreSQL (hosted on [Supabase](https://supabase.com))
- **ORM**: [Prisma 7](https://www.prisma.io) with `@prisma/adapter-pg` pooler integration
- **Authentication**: Custom stateless JWT authentication (`jose`) with HTTP-only, SameSite, Secure cookies and `bcryptjs` password hashing (No Supabase Auth)
- **Asset Storage**: [Cloudinary](https://cloudinary.com) REST API (direct signed uploads with zero client package bloat)

---

## 💻 Getting Started Locally

### 1. Prerequisites
- Node.js 20.x or later
- npm or yarn
- A PostgreSQL database instance (or Supabase project)

### 2. Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-org/bootcamp-lms.git
   cd bootcamp-lms
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Fill in your configuration:
   ```env
   # PostgreSQL (Supabase)
   DATABASE_URL="postgresql://user:password@host:6543/postgres?pgbouncer=true&schema=public"
   DIRECT_URL="postgresql://user:password@host:5432/postgres?schema=public"

   # JWT Secrets (generate with: openssl rand -base64 48)
   JWT_ACCESS_SECRET="your-32-char-min-access-secret"
   JWT_REFRESH_SECRET="your-32-char-min-refresh-secret"

   # Cloudinary (for assignment file uploads)
   CLOUDINARY_CLOUD_NAME="your_cloud_name"
   CLOUDINARY_API_KEY="your_api_key"
   CLOUDINARY_API_SECRET="your_api_secret"
   ```

4. **Initialize Database Schema**:
   ```bash
   npx prisma db push
   ```

5. **Seed Test Development Data**:
   ```bash
   npx tsx prisma/seed.ts
   ```

6. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🔑 Default Test Accounts (Local / Seed)

| Role | Email | Password | Assigned Track |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@example.com` | `Password123!` | All tracks & cohorts |
| **Instructor** | `instructor@example.com` | `Password123!` | Foundations & Intermediate |
| **Student** | `student@example.com` | `Password123!` | Foundations |

---

## 🧪 Verification & Quality Checks

Run the verification suites to validate database integrity, business logic, and compilation:

```bash
# 1. Type Check
npm run build

# 2. ESLint Check
npm run lint

# 3. Post-MVP Verification Matrix (20 automated integration tests)
node --env-file=.env ./node_modules/.bin/tsx scripts/verify-final.ts
```

---

## 📁 Repository Structure

```text
├── prisma/
│   ├── schema.prisma       # Database models (User, Cohort, Track, Session, Attendance, Assignment, Chat, etc.)
│   └── seed.ts             # Development seed data
├── scripts/
│   ├── verify-final.ts     # Automated integration & verification test matrix
│   └── smoke-test.sh       # HTTP smoke testing script
├── src/
│   ├── app/
│   │   ├── (student)/      # Student portal routes (dashboard, classes, assignments, progress, chat, certificate)
│   │   ├── instructor/     # Instructor portal routes (grading, attendance, classes, excuses, progress)
│   │   ├── admin/          # Admin console routes (cohorts, tracks, users, audit-log, completion)
│   │   └── api/            # Authentication, export, and chat polling endpoints
│   ├── components/         # Reusable UI cards, tables, modals, and directory components
│   ├── lib/
│   │   ├── auth/           # JWT creation, session cookies, and role guards
│   │   ├── attendance/     # Check-in logic, attendance formula, and CSV imports
│   │   ├── assignments/    # Submissions, grading, and rubric evaluation
│   │   ├── completion/     # Graduation policy and certificate eligibility
│   │   ├── storage/        # Cloudinary file upload integration
│   │   └── audit/          # System audit logger
│   └── types/              # Shared client-safe TypeScript types
└── package.json
```

---

## 📜 License
Internal bootcamp project — all rights reserved.

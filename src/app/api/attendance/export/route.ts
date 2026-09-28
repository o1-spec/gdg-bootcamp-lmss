import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { Role } from "@prisma/client";
import { getSessionAttendance } from "@/lib/attendance/queries";

function escapeCsvField(field: string | null | undefined): string {
  if (field === null || field === undefined) return '""';
  const stringValue = String(field);
  return `"${stringValue.replace(/"/g, '""')}"`;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 50);
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user || (user.role !== Role.INSTRUCTOR && user.role !== Role.ADMIN)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json(
      { error: "sessionId query parameter is required" },
      { status: 400 }
    );
  }

  const attendanceData = await getSessionAttendance(sessionId, user.id, user.role);

  if (!attendanceData) {
    return NextResponse.json(
      { error: "Session not found or access denied" },
      { status: 404 }
    );
  }

  const { session, roster } = attendanceData;
  const sessionDateStr = new Date(session.startsAt).toISOString().split("T")[0];

  // CSV Headers
  const headers = [
    "Student Name",
    "Email",
    "Track",
    "Session",
    "Session Date",
    "Status",
    "Method",
    "Marked At",
  ];

  const rows = [headers.join(",")];

  for (const student of roster) {
    const row = [
      escapeCsvField(student.name),
      escapeCsvField(student.email),
      escapeCsvField(student.trackName),
      escapeCsvField(session.title),
      escapeCsvField(sessionDateStr),
      escapeCsvField(student.status),
      escapeCsvField(student.method || "N/A"),
      escapeCsvField(student.markedAt ? student.markedAt.toISOString() : "N/A"),
    ];
    rows.push(row.join(","));
  }

  const csvContent = rows.join("\r\n");
  const filename = `attendance-${slugify(session.title)}-${sessionDateStr}.csv`;

  return new Response(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

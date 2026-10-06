"use server";

/*
|--------------------------------------------------
| npm imports
|--------------------------------------------------
*/
import { Role } from "@prisma/client";

/*
|--------------------------------------------------
| custom imports
|--------------------------------------------------
*/
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";

/*
|--------------------------------------------------
| types
|--------------------------------------------------
*/
type RosterRow = { email: string; name: string | null; role: Role; trackName: string };

export type ImportRosterResult =
  | { success: true; imported: number; updated: number }
  | { success: false; error: string };

/*
|----------------------------------------------------------------------------------------------------
| parseCsv
|----------------------------------------------------------------------------------------------------
| RFC 4180-compliant CSV parser handling quoted cells, line breaks, and whitespace trimming.
*/
function parseCsv(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    const next = csv[i + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      i++;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i++;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

/*
|----------------------------------------------------------------------------------------------------
| importRegistrationRosterAction
|----------------------------------------------------------------------------------------------------
| Server action handling import Registration Roster workflows and cache revalidations.
*/
export async function importRegistrationRosterAction(csv: string): Promise<ImportRosterResult> {
  await requireAdmin();

  const rows = parseCsv(csv);
  if (rows.length < 2) {
    return { success: false, error: "Upload a CSV with a header row and at least one participant." };
  }

  const headers = rows[0].map((header) => header.trim().toLowerCase());
  const emailIndex = headers.indexOf("email");
  const nameIndex = headers.indexOf("name");
  const roleIndex = headers.indexOf("role");
  const trackIndex = headers.indexOf("track");
  if (emailIndex < 0 || roleIndex < 0 || trackIndex < 0) {
    return { success: false, error: "CSV headers must include: email, role, and track. Name is optional." };
  }

  const roster: RosterRow[] = [];
  const emails = new Set<string>();
  for (let index = 1; index < rows.length; index++) {
    const row = rows[index];
    const email = (row[emailIndex] ?? "").trim().toLowerCase();
    const name = nameIndex >= 0 ? (row[nameIndex] ?? "").trim() || null : null;
    const role = (row[roleIndex] ?? "").trim().toUpperCase();
    const trackName = (row[trackIndex] ?? "").trim();

    if (!/^\S+@\S+\.\S+$/.test(email) || !trackName || (role !== Role.STUDENT && role !== Role.INSTRUCTOR)) {
      return { success: false, error: `Row ${index + 1} must have a valid email, STUDENT or INSTRUCTOR role, and track name.` };
    }
    if (emails.has(email)) {
      return { success: false, error: `The email ${email} appears more than once in this CSV.` };
    }
    emails.add(email);
    roster.push({ email, name, role, trackName });
  }

  const tracks = await db.track.findMany({ select: { id: true, name: true } });
  const trackIds = new Map<string, string>();
  for (const track of tracks) {
    const key = track.name.trim().toLowerCase();
    if (trackIds.has(key)) {
      return { success: false, error: `Track name "${track.name}" is ambiguous. Rename tracks uniquely before importing.` };
    }
    trackIds.set(key, track.id);
  }

  for (const row of roster) {
    if (!trackIds.has(row.trackName.toLowerCase())) {
      return { success: false, error: `Track "${row.trackName}" in the CSV does not exist.` };
    }
  }

  const existingUsers = await db.user.findMany({
    where: { email: { in: roster.map((row) => row.email) } },
    select: { email: true },
  });
  if (existingUsers.length) {
    return { success: false, error: `Cannot import existing account(s): ${existingUsers.map((user) => user.email).join(", ")}.` };
  }

  let imported = 0;
  let updated = 0;
  await db.$transaction(async (tx) => {
    for (const row of roster) {
      const existing = await tx.registration.findUnique({ where: { email: row.email } });
      if (existing?.claimedAt) {
        throw new Error(`${row.email} has already completed signup and cannot be changed by roster import.`);
      }
      const data = {
        name: row.name,
        role: row.role,
        trackId: trackIds.get(row.trackName.toLowerCase())!,
      };
      if (existing) {
        await tx.registration.update({ where: { id: existing.id }, data });
        updated++;
      } else {
        await tx.registration.create({ data: { email: row.email, ...data } });
        imported++;
      }
    }
  });

  return { success: true, imported, updated };
}

import { db } from "@/lib/db";

// ── Rubric CRUD ───────────────────────────────────────────────────────────────

export interface RubricWithCriteria {
  id: string;
  assignmentId: string;
  title: string;
  criteria: {
    id: string;
    title: string;
    description: string | null;
    maxScore: number;
    sortOrder: number;
  }[];
}

export async function getRubricByAssignment(
  assignmentId: string
): Promise<RubricWithCriteria | null> {
  return db.rubric.findUnique({
    where: { assignmentId },
    include: { criteria: { orderBy: { sortOrder: "asc" } } },
  });
}

export async function createRubric(
  assignmentId: string,
  title: string,
  criteria: { title: string; description?: string; maxScore: number; sortOrder?: number }[]
) {
  // Validate total matches assignment maxScore
  const assignment = await db.assignment.findUnique({ where: { id: assignmentId } });
  if (!assignment) throw new Error("Assignment not found");

  const criteriaTotal = criteria.reduce((s, c) => s + c.maxScore, 0);
  if (criteriaTotal !== assignment.maxScore) {
    throw new Error(
      `Rubric total (${criteriaTotal}) must equal assignment max score (${assignment.maxScore}).`
    );
  }

  return db.rubric.create({
    data: {
      assignmentId,
      title,
      criteria: {
        create: criteria.map((c, i) => ({
          title: c.title,
          description: c.description,
          maxScore: c.maxScore,
          sortOrder: c.sortOrder ?? i,
        })),
      },
    },
    include: { criteria: { orderBy: { sortOrder: "asc" } } },
  });
}

export async function deleteRubric(assignmentId: string) {
  // Only allowed if no scores have been recorded yet
  const rubric = await db.rubric.findUnique({
    where: { assignmentId },
    include: { criteria: { include: { scores: { take: 1 } } } },
  });
  if (!rubric) return;
  const hasScores = rubric.criteria.some((c) => c.scores.length > 0);
  if (hasScores) throw new Error("Cannot delete a rubric after grading has started.");
  await db.rubric.delete({ where: { id: rubric.id } });
}

// ── Rubric scoring ────────────────────────────────────────────────────────────

export interface RubricScoreInput {
  criterionId: string;
  score: number;
  feedback?: string;
}

/**
 * Saves rubric scores for a submission and returns the computed total.
 * Also validates each criterion score is within bounds.
 */
export async function saveRubricScores(
  submissionId: string,
  scores: RubricScoreInput[]
): Promise<number> {
  // Fetch criteria to validate bounds
  const criterionIds = scores.map((s) => s.criterionId);
  const criteria = await db.rubricCriterion.findMany({
    where: { id: { in: criterionIds } },
  });
  const criteriaMap = Object.fromEntries(criteria.map((c) => [c.id, c]));

  for (const s of scores) {
    const c = criteriaMap[s.criterionId];
    if (!c) throw new Error(`Unknown criterion: ${s.criterionId}`);
    if (s.score < 0 || s.score > c.maxScore) {
      throw new Error(
        `Score for "${c.title}" must be between 0 and ${c.maxScore}. Got ${s.score}.`
      );
    }
  }

  // Upsert each score
  await Promise.all(
    scores.map((s) =>
      db.rubricScore.upsert({
        where: { submissionId_criterionId: { submissionId, criterionId: s.criterionId } },
        update: { score: s.score, feedback: s.feedback },
        create: { submissionId, criterionId: s.criterionId, score: s.score, feedback: s.feedback },
      })
    )
  );

  return scores.reduce((sum, s) => sum + s.score, 0);
}

/**
 * Fetch rubric scores for a submission (used on grading + student result pages).
 */
export async function getSubmissionRubricScores(submissionId: string) {
  return db.rubricScore.findMany({
    where: { submissionId },
    include: { criterion: { select: { title: true, description: true, maxScore: true } } },
    orderBy: { criterion: { sortOrder: "asc" } },
  });
}

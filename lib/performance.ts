/**
 * Performance, the parts that are plain logic: phases, weights, which cycle
 * to open on, and the body a review form sends. Kept apart from the
 * screens so it can be tested, and so the self-review and a manager's
 * review build their answer the same way.
 */

export type Phase =
  | "draft"
  | "goal_setting"
  | "in_progress"
  | "self_review"
  | "manager_review"
  | "calibration"
  | "closed";

/** Phases in which an employee still has something to do. */
export const LIVE_PHASES: Phase[] = [
  "goal_setting",
  "in_progress",
  "self_review",
  "manager_review",
];

/** Phases in which a manager sets and agrees goals. */
export const GOAL_PHASES: Phase[] = ["goal_setting", "in_progress"];

const PHASE_LABEL: Record<Phase, string> = {
  draft: "Draft",
  goal_setting: "Goal setting",
  in_progress: "In progress",
  self_review: "Self-review",
  manager_review: "Manager review",
  calibration: "Calibration",
  closed: "Closed",
};

export function phaseLabel(phase: string | null | undefined): string {
  return PHASE_LABEL[phase as Phase] ?? (phase ?? "").replace(/_/g, " ");
}

/** What a phase asks of the employee, in a sentence. */
export const PHASE_HELP: Partial<Record<Phase, string>> = {
  goal_setting: "Your manager is agreeing your goals with you.",
  in_progress: "Work towards your goals and keep their progress up to date.",
  self_review:
    "Write your self-review: rate your goals and say how the period went.",
  manager_review:
    "Your manager is writing your review. You can still give peer or upward feedback.",
  calibration:
    "Ratings are being compared across the company before they are shared.",
  closed: "This cycle is finished.",
};

/** "50%" — weights are fractions in the API. */
export function percent(fraction: number | null | undefined): string {
  if (fraction === null || fraction === undefined) return "—";
  return `${Math.round(fraction * 1000) / 10}%`;
}

/**
 * The cycle to open on: one with something owed, else one still running,
 * else the newest. Opening on the newest alone hid a review that was due.
 */
export function preferredCycle<T extends { phase: string; owed?: number }>(
  cycles: T[],
): T | undefined {
  return (
    cycles.find((cycle) => (cycle.owed ?? 0) > 0) ??
    cycles.find((cycle) => LIVE_PHASES.includes(cycle.phase as Phase)) ??
    cycles[0]
  );
}

/** A manager opens on a cycle that needs them: goals to agree, or reviews to write. */
export function preferredTeamCycle<T extends { phase: string }>(
  cycles: T[],
): T | undefined {
  return (
    cycles.find((cycle) =>
      ["goal_setting", "manager_review"].includes(cycle.phase),
    ) ?? cycles[0]
  );
}

export interface Rating {
  rating?: number;
  comment?: string;
}

export interface ReviewDraft {
  goals: Record<string, Rating>;
  competencies: Record<string, Rating>;
  strengths: string;
  developmentAreas: string;
  overallComment: string;
}

export interface ReviewBody {
  goalRatings: { goalId: string; rating: number; comment?: string }[];
  competencyRatings: { competency: string; rating: number; comment?: string }[];
  strengths?: string;
  developmentAreas?: string;
  overallComment?: string;
  submit: boolean;
}

/** A form's starting point: the saved draft, or nothing. */
export function draftFrom(
  review: {
    goalRatings?: { goalId: string; rating: number; comment?: string }[];
    competencyRatings?: {
      competency: string;
      rating: number;
      comment?: string;
    }[];
    strengths?: string;
    developmentAreas?: string;
    overallComment?: string;
  } | null,
): ReviewDraft {
  return {
    goals: Object.fromEntries(
      (review?.goalRatings ?? []).map((r) => [
        r.goalId,
        { rating: r.rating, comment: r.comment },
      ]),
    ),
    competencies: Object.fromEntries(
      (review?.competencyRatings ?? []).map((r) => [
        r.competency,
        { rating: r.rating, comment: r.comment },
      ]),
    ),
    strengths: review?.strengths ?? "",
    developmentAreas: review?.developmentAreas ?? "",
    overallComment: review?.overallComment ?? "",
  };
}

/** What the API takes: only rated items, blanks left out rather than sent empty. */
export function reviewBody(draft: ReviewDraft, submit: boolean): ReviewBody {
  const trimmed = (value?: string) => value?.trim() || undefined;
  return {
    goalRatings: Object.entries(draft.goals)
      .filter(([, value]) => value.rating !== undefined)
      .map(([goalId, value]) => ({
        goalId,
        rating: value.rating!,
        comment: trimmed(value.comment),
      })),
    competencyRatings: Object.entries(draft.competencies)
      .filter(([, value]) => value.rating !== undefined)
      .map(([competency, value]) => ({
        competency,
        rating: value.rating!,
        comment: trimmed(value.comment),
      })),
    strengths: trimmed(draft.strengths),
    developmentAreas: trimmed(draft.developmentAreas),
    overallComment: trimmed(draft.overallComment),
    submit,
  };
}

/** How much of a form is rated, of what can be. */
export function ratedCount(
  draft: ReviewDraft,
  goalIds: string[],
  competencyNames: string[],
): { rated: number; total: number } {
  const rated =
    goalIds.filter((id) => draft.goals[id]?.rating !== undefined).length +
    competencyNames.filter(
      (name) => draft.competencies[name]?.rating !== undefined,
    ).length;
  return { rated, total: goalIds.length + competencyNames.length };
}

/** A progress entry as a whole percentage, 0–100, or null when it isn't a number. */
export function parseProgress(text: string): number | null {
  if (!text.trim()) return null;
  const value = Number(text);
  if (!Number.isFinite(value)) return null;
  return Math.max(0, Math.min(100, Math.round(value)));
}

/** The total of a set of goal weights, as a percentage to one decimal place. */
export function weightTotal(
  goals: { weight: number; status: string }[],
): number {
  return (
    Math.round(
      goals
        .filter((goal) => goal.status !== "cancelled")
        .reduce((sum, goal) => sum + goal.weight, 0) * 1000,
    ) / 10
  );
}

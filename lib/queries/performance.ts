import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { http } from "@/lib/api";
import type { Body, Res } from "@/lib/api/types";
import type { ReviewBody } from "@/lib/performance";

/**
 * Performance self-service: an employee's own cycles, goals, reviews and
 * appraisals, and a manager's reviews of their direct reports. All under
 * /me — nobody needs a performance permission to take part.
 */

export type MyCycle = Res<"GET /me/performance/cycles">[number];
export type Goal = Res<"GET /me/performance/cycles/{cycleId}/goals">[number];
export type OwedReview =
  Res<"GET /me/performance/cycles/{cycleId}/pending-reviews">[number];
export type SelfReviewForm =
  Res<"GET /me/performance/cycles/{cycleId}/self-review">;
export type Appraisal = Res<"GET /me/performance/appraisals">[number];
export type ScaleLevel = MyCycle["ratingScale"][number];
export type Competency = SelfReviewForm["competencies"][number];
export type Review = NonNullable<SelfReviewForm["review"]>;
export type TeamCycle = Res<"GET /me/team/performance/cycles">[number];
export type TeamReport =
  Res<"GET /me/team/performance/cycles/{cycleId}/reports">[number];
export type TeamReportDetail =
  Res<"GET /me/team/performance/cycles/{cycleId}/reports/{employeeId}">;

export const performanceKeys = {
  all: ["performance"] as const,
  cycles: ["performance", "cycles"] as const,
  appraisals: ["performance", "appraisals"] as const,
  goals: (cycleId: string) => ["performance", "goals", cycleId] as const,
  owed: (cycleId: string) => ["performance", "owed", cycleId] as const,
  selfReview: (cycleId: string) =>
    ["performance", "self-review", cycleId] as const,
  targets: ["performance", "feedback-targets"] as const,
  feedback: (cycleId: string, employeeId: string) =>
    ["performance", "feedback", cycleId, employeeId] as const,
  team: ["performance", "team"] as const,
  teamCycles: ["performance", "team", "cycles"] as const,
  reports: (cycleId: string) =>
    ["performance", "team", "reports", cycleId] as const,
  report: (cycleId: string, employeeId: string) =>
    ["performance", "team", "report", cycleId, employeeId] as const,
};

const get = async <T>(path: string) => (await http.get<T>(path)).data;

export function useMyCycles() {
  return useQuery({
    queryKey: performanceKeys.cycles,
    queryFn: () => get<MyCycle[]>("/me/performance/cycles"),
  });
}

export function useMyAppraisals() {
  return useQuery({
    queryKey: performanceKeys.appraisals,
    queryFn: () => get<Appraisal[]>("/me/performance/appraisals"),
  });
}

export function useMyGoals(cycleId: string | undefined) {
  return useQuery({
    queryKey: performanceKeys.goals(cycleId ?? ""),
    queryFn: () => get<Goal[]>(`/me/performance/cycles/${cycleId}/goals`),
    enabled: !!cycleId,
  });
}

export function useOwedReviews(cycleId: string | undefined) {
  return useQuery({
    queryKey: performanceKeys.owed(cycleId ?? ""),
    queryFn: () =>
      get<OwedReview[]>(`/me/performance/cycles/${cycleId}/pending-reviews`),
    enabled: !!cycleId,
  });
}

export function useSelfReviewForm(cycleId: string) {
  return useQuery({
    queryKey: performanceKeys.selfReview(cycleId),
    queryFn: () =>
      get<SelfReviewForm>(`/me/performance/cycles/${cycleId}/self-review`),
  });
}

export function useFeedbackTargets() {
  return useQuery({
    queryKey: performanceKeys.targets,
    queryFn: () =>
      get<Res<"GET /me/performance/feedback-targets">>(
        "/me/performance/feedback-targets",
      ),
  });
}

/** What I have written for someone this cycle, or null if nothing yet. */
export function useMyFeedback(cycleId: string, employeeId: string | null) {
  return useQuery({
    queryKey: performanceKeys.feedback(cycleId, employeeId ?? ""),
    queryFn: async () => {
      const { data } = await http.get<Review | "" | null>(
        `/me/performance/cycles/${cycleId}/feedback/${employeeId}`,
      );
      // Nothing written yet comes back as an empty body, not as JSON null.
      return data || null;
    },
    enabled: !!employeeId,
  });
}

/** After anything I send, what is owed and each cycle's count move too. */
function useInvalidateMine() {
  const queryClient = useQueryClient();
  return (...keys: (readonly unknown[])[]) =>
    Promise.all([
      ...keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      queryClient.invalidateQueries({ queryKey: ["performance", "owed"] }),
      queryClient.invalidateQueries({ queryKey: performanceKeys.cycles }),
    ]);
}

export function useUpdateProgress(cycleId: string) {
  const invalidate = useInvalidateMine();
  return useMutation({
    mutationFn: async (input: { goalId: string; progress: number }) =>
      (
        await http.patch<Res<"PATCH /me/performance/goals/{id}/progress">>(
          `/me/performance/goals/${input.goalId}/progress`,
          {
            progress: input.progress,
          } satisfies Body<"PATCH /me/performance/goals/{id}/progress">,
        )
      ).data,
    onSuccess: () => invalidate(performanceKeys.goals(cycleId)),
  });
}

export function useSaveSelfReview(cycleId: string) {
  const invalidate = useInvalidateMine();
  return useMutation({
    mutationFn: async (body: ReviewBody) =>
      (
        await http.put<Review>(
          `/me/performance/cycles/${cycleId}/self-review`,
          body,
        )
      ).data,
    onSuccess: () => invalidate(performanceKeys.selfReview(cycleId)),
  });
}

export function useSaveFeedback(cycleId: string) {
  const invalidate = useInvalidateMine();
  return useMutation({
    mutationFn: async (
      body: Body<"PUT /me/performance/cycles/{cycleId}/feedback">,
    ) =>
      (
        await http.put<Review>(
          `/me/performance/cycles/${cycleId}/feedback`,
          body,
        )
      ).data,
    onSuccess: (_review, body) =>
      invalidate(performanceKeys.feedback(cycleId, body.employeeId)),
  });
}

export function useRespondToAppraisal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: {
        id: string;
      } & Body<"POST /me/performance/appraisals/{id}/acknowledge">,
    ) => {
      // The id goes in the URL, never the body: the API refuses unknown fields.
      const { id, ...body } = input;
      return (
        await http.post<Appraisal>(
          `/me/performance/appraisals/${id}/acknowledge`,
          body,
        )
      ).data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: performanceKeys.appraisals }),
  });
}

// ── A manager's reviews of their direct reports ────────────────────

export function useTeamCycles() {
  return useQuery({
    queryKey: performanceKeys.teamCycles,
    queryFn: () => get<TeamCycle[]>("/me/team/performance/cycles"),
  });
}

export function useTeamReports(cycleId: string | undefined) {
  return useQuery({
    queryKey: performanceKeys.reports(cycleId ?? ""),
    queryFn: () =>
      get<TeamReport[]>(`/me/team/performance/cycles/${cycleId}/reports`),
    enabled: !!cycleId,
  });
}

export function useTeamReport(cycleId: string, employeeId: string) {
  return useQuery({
    queryKey: performanceKeys.report(cycleId, employeeId),
    queryFn: () =>
      get<TeamReportDetail>(
        `/me/team/performance/cycles/${cycleId}/reports/${employeeId}`,
      ),
  });
}

/** Everything a manager does to one report refreshes that report and the team list. */
function useReportMutation<TInput>(
  cycleId: string,
  employeeId: string,
  run: (base: string, input: TInput) => Promise<unknown>,
) {
  const queryClient = useQueryClient();
  const base = `/me/team/performance/cycles/${cycleId}/reports/${employeeId}`;
  return useMutation({
    mutationFn: (input: TInput) => run(base, input),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: performanceKeys.report(cycleId, employeeId),
        }),
        queryClient.invalidateQueries({
          queryKey: performanceKeys.reports(cycleId),
        }),
        queryClient.invalidateQueries({ queryKey: ["performance", "owed"] }),
      ]),
  });
}

export function useAddGoal(cycleId: string, employeeId: string) {
  return useReportMutation<
    Body<"POST /me/team/performance/cycles/{cycleId}/reports/{employeeId}/goals">
  >(cycleId, employeeId, (base, body) => http.post(`${base}/goals`, body));
}

export function useUpdateGoal(cycleId: string, employeeId: string) {
  return useReportMutation<
    {
      goalId: string;
    } & Body<"PATCH /me/team/performance/cycles/{cycleId}/reports/{employeeId}/goals/{goalId}">
  >(cycleId, employeeId, (base, { goalId, ...body }) =>
    http.patch(`${base}/goals/${goalId}`, body),
  );
}

export function useActivateGoals(cycleId: string, employeeId: string) {
  return useReportMutation<void>(cycleId, employeeId, (base) =>
    http.post(`${base}/goals/activate`),
  );
}

export function useSaveManagerReview(cycleId: string, employeeId: string) {
  return useReportMutation<ReviewBody>(cycleId, employeeId, (base, body) =>
    http.put(`${base}/review`, body),
  );
}

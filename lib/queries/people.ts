import { useQuery } from "@tanstack/react-query";

import { http } from "@/lib/api";
import type { Item, Res } from "@/lib/api/types";

/** The people around me: my direct reports, and colleagues to hand work over to. */

export type TeamMember = Item<"GET /me/team">;

export type Colleague = Item<"GET /me/colleagues">;

export type Enrolment = Item<"GET /me/learning">;

export function useMyTeam() {
  return useQuery({
    queryKey: ["team"],
    queryFn: async () => (await http.get<Res<"GET /me/team">>("/me/team")).data,
    // A reporting line changes when HR moves someone.
    staleTime: 15 * 60 * 1000,
  });
}

export function useColleagues(enabled = true) {
  return useQuery({
    queryKey: ["colleagues"],
    queryFn: async () => (await http.get<Res<"GET /me/colleagues">>("/me/colleagues")).data,
    enabled,
    staleTime: 15 * 60 * 1000,
  });
}

export function useMyLearning() {
  return useQuery({
    queryKey: ["learning"],
    queryFn: async () => (await http.get<Res<"GET /me/learning">>("/me/learning")).data,
  });
}

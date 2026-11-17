import { useQuery } from "@tanstack/react-query";

import { http } from "@/lib/api";
import type { Res } from "@/lib/api/types";

export type Module = Res<"GET /me/entitlements">["modules"][number];

/**
 * The modules this employer's plan includes, less any switched off for
 * the employee's company (the server already leaves those out).
 *
 * Only decides what is OFFERED: a row for a module the employer doesn't
 * have leads to a 403, which reads as a broken app. The server still
 * enforces every call. So it fails open — while loading, or if the call
 * fails, everything is shown and the server has the last word.
 */
export function useModules() {
  const query = useQuery({
    queryKey: ["entitlements"],
    queryFn: async () =>
      (await http.get<Res<"GET /me/entitlements">>("/me/entitlements")).data,
    // An administrator can switch a module off for the company at any time;
    // coming back to the app refetches it (focusManager, lib/connectivity).
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const has = (module: Module): boolean =>
    !query.data ||
    query.data.unrestricted ||
    query.data.modules.includes(module);

  return { has };
}

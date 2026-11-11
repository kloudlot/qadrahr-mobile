import { useQuery } from "@tanstack/react-query";

import { http } from "@/lib/api";
import type { Res } from "@/lib/api/types";

export type Module = Res<"GET /me/entitlements">["modules"][number];

/**
 * The modules this employer's plan includes.
 *
 * Only decides what is OFFERED: a row for a module the employer doesn't
 * have leads to a 403, which reads as a broken app. The server still
 * enforces every call. So it fails open — while loading, or if the call
 * fails, everything is shown and the server has the last word.
 */
export function useModules() {
  const query = useQuery({
    queryKey: ["entitlements"],
    queryFn: async () => (await http.get<Res<"GET /me/entitlements">>("/me/entitlements")).data,
    // A plan changes when the operator changes it, not between screens.
    staleTime: 60 * 60 * 1000,
    retry: false,
  });

  const has = (module: Module): boolean =>
    !query.data || query.data.unrestricted || query.data.modules.includes(module);

  return { has };
}

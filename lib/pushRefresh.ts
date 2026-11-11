import type { QueryClient } from "@tanstack/react-query";

/**
 * The cached data a push makes stale, by its notification type.
 *
 * The notifications list and count always; then whatever the push is
 * about, so a payslip push while Pay is open shows the payslip without a
 * pull. Query key roots only — each screen's keys start with one of these
 * (lib/queries/*), and invalidating a root refetches only what is mounted.
 */
export function keysForPush(type: string): string[][] {
  const keys: string[][] = [["notifications"]];

  if (type === "workflow.decided") {
    // An outcome on something I asked for, whatever it was.
    keys.push(["requests"], ["leave"], ["expenses"], ["assets"]);
  } else if (type.startsWith("workflow.") || type.startsWith("approval.")) {
    keys.push(["approvals"]);
  } else if (type.startsWith("payslip.")) {
    keys.push(["payslips"]);
  } else if (type.startsWith("broadcast.")) {
    keys.push(["broadcasts"]);
  } else if (type.startsWith("performance.")) {
    keys.push(["performance"]);
  } else if (type.startsWith("asset.")) {
    keys.push(["assets"]);
  } else if (type.startsWith("leave.")) {
    keys.push(["leave"]);
  }
  return keys;
}

export async function refreshForPush(
  queryClient: QueryClient,
  type: string,
): Promise<void> {
  await Promise.all(
    keysForPush(type).map((queryKey) =>
      queryClient.invalidateQueries({ queryKey }),
    ),
  );
}

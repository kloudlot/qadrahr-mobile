import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { http } from "@/lib/api";
import type { Item, Res } from "@/lib/api/types";

/**
 * The approvals inbox.
 *
 * One queue across every subject type — leave, expenses, attendance
 * corrections — because an approver has one queue in their head. The
 * server resolves who a request is waiting on, so nothing here decides
 * whether the caller may approve something: the inbox only ever contains
 * what is already waiting on them.
 */

export type ApprovalItem = Item<"GET /approvals/inbox">;


export const approvalKeys = {
  all: ["approvals"] as const,
  inbox: ["approvals", "inbox"] as const,
};

export function useApprovalInbox() {
  return useQuery({
    queryKey: approvalKeys.inbox,
    queryFn: async () => {
      const { data } = await http.get<Res<"GET /approvals/inbox">>("/approvals/inbox", {
        params: { limit: 50 },
      });
      return data;
    },
  });
}

export type Decision = "approved" | "rejected" | "returned";

export function useDecide() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string; decision: Decision; comment?: string }) => {
      await http.post(`/approvals/${input.id}/decide`, {
        decision: input.decision,
        comment: input.comment,
      });
    },
    onSuccess: async () => {
      // The inbox shrinks, and whatever the decision touched may have
      // moved too — a leave approval changes the requester's balance,
      // but not this user's, so only the inbox is invalidated here.
      await queryClient.invalidateQueries({ queryKey: approvalKeys.all });
    },
  });
}

/**
 * A human label for a subject type.
 *
 * The wire values are dotted identifiers (`employee.leave_request`).
 * Unknown types fall back to the last segment rather than the raw
 * string, so a module added later reads as "training request" rather
 * than "employee.training_request".
 */
export function describeSubject(subjectType: string): string {
  // The subject types the server's modules raise — see the backend's
  // workflow subject registry.
  const KNOWN: Record<string, string> = {
    "leave.request": "Leave request",
    "employee.expense_claim": "Expense claim",
    "attendance.correction": "Attendance correction",
    "employee.profile_change": "Profile change",
    "employee.exit": "Resignation",
    "employee.loan": "Loan application",
    "employee.promotion": "Promotion",
    "payroll.run": "Payroll run",
    "recruitment.requisition": "Job requisition",
    "recruitment.offer": "Job offer",
  };

  const known = KNOWN[subjectType];
  if (known) return known;

  const tail = subjectType.split(".").pop() ?? subjectType;
  const words = tail.replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

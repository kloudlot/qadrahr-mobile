import {
  CalendarDays,
  ClipboardList,
  DoorOpen,
  HandCoins,
  ReceiptText,
  TimerReset,
  UserPen,
  type LucideIcon,
} from "lucide-react-native";

import type { ApprovalItem } from "@/lib/queries/approvals";
import { formatDate } from "@/lib/format";

/**
 * An icon per kind of request, so a list of them is scannable.
 *
 * A component with a fixed switch rather than a function returning an icon
 * type: choosing a component at render time defeats the React Compiler.
 */
export function SubjectIcon({ subjectType, size = 20, color }: { subjectType: string; size?: number; color: string }) {
  switch (subjectType) {
    case "leave.request":
      return <CalendarDays size={size} color={color} />;
    case "attendance.correction":
      return <TimerReset size={size} color={color} />;
    case "employee.profile_change":
      return <UserPen size={size} color={color} />;
    case "employee.expense_claim":
      return <ReceiptText size={size} color={color} />;
    case "employee.exit":
      return <DoorOpen size={size} color={color} />;
    case "employee.loan":
      return <HandCoins size={size} color={color} />;
    default:
      return <ClipboardList size={size} color={color} />;
  }
}

/** The icon TYPE, for components that take one as a prop (ListRow). */
export function iconFor(subjectType: string): LucideIcon {
  switch (subjectType) {
    case "leave.request":
      return CalendarDays;
    case "attendance.correction":
      return TimerReset;
    case "employee.profile_change":
      return UserPen;
    case "employee.expense_claim":
      return ReceiptText;
    case "employee.exit":
      return DoorOpen;
    case "employee.loan":
      return HandCoins;
    default:
      return ClipboardList;
  }
}

/**
 * One line of detail from what the module put in the payload — read
 * defensively, because the payload is whatever the raising module chose
 * to send and differs per type.
 */
export function detailFor(item: ApprovalItem): string | null {
  const p = item.payload ?? {};
  const str = (key: string) => (typeof p[key] === "string" ? (p[key] as string) : null);
  const num = (key: string) => (typeof p[key] === "number" ? (p[key] as number) : null);

  switch (item.subjectType) {
    case "leave.request": {
      const days = num("days");
      return days !== null ? `${days} ${days === 1 ? "day" : "days"}` : null;
    }
    case "attendance.correction":
      return str("requestedTime");
    case "employee.exit": {
      const last = str("lastWorkingDay");
      return last ? `Last day ${formatDate(last)}` : null;
    }
    case "employee.profile_change": {
      const fields = Array.isArray(p.fields) ? (p.fields as string[]) : [];
      return fields.length ? fields.map((f) => f.replace(/([A-Z])/g, " $1").toLowerCase()).join(", ") : null;
    }
    default:
      return null;
  }
}

/** Where a request stands, in words. */
export function whereIsIt(item: ApprovalItem): string {
  const step = item.resolvedSteps?.find((s) => s.order === item.currentStepOrder);
  switch (item.state) {
    case "pending": {
      const who = item.currentApproverNames?.length ? item.currentApproverNames.join(", ") : null;
      return who ? `Waiting on ${who}` : step ? `At “${step.name}”` : "Waiting for approval";
    }
    case "returned":
      return "Sent back to you for changes";
    case "blocked":
      return "Stuck — HR has been told";
    case "approved":
      return "Approved";
    case "rejected":
      return "Not approved";
    case "cancelled":
      return "Withdrawn";
    case "expired":
      return "Expired before a decision";
  }
}

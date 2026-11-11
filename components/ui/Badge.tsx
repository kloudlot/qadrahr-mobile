import type { ReactNode } from "react";
import { View } from "react-native";
import type { LucideIcon } from "lucide-react-native";

import { cn } from "@/lib/cn";
import { useThemeColors } from "@/lib/theme/ThemeProvider";
import { Text } from "./Text";

export type Tone = "brand" | "success" | "warning" | "danger" | "info" | "neutral";

const TONE: Record<Tone, { box: string; text: string }> = {
  brand: { box: "bg-brand-subtle", text: "text-brand" },
  success: { box: "bg-success-subtle", text: "text-success-ink" },
  warning: { box: "bg-warning-subtle", text: "text-warning-ink" },
  danger: { box: "bg-danger-subtle", text: "text-danger-ink" },
  info: { box: "bg-info-subtle", text: "text-info-ink" },
  neutral: { box: "bg-neutral-subtle", text: "text-neutral-ink" },
};

/** A small pill of status or context. */
export function Badge({
  children,
  tone = "neutral",
  icon: Icon,
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  icon?: LucideIcon;
  className?: string;
}) {
  const colors = useThemeColors();
  const iconColor = {
    brand: colors.brand,
    success: colors.success,
    warning: colors.warning,
    danger: colors.danger,
    info: colors.info,
    neutral: colors.neutral,
  }[tone];
  return (
    <View className={cn("flex-row items-center gap-1 self-start rounded-pill px-2.5 py-1", TONE[tone].box, className)}>
      {Icon ? <Icon size={12} color={iconColor} strokeWidth={2.4} /> : null}
      <Text variant="caption" className={cn("font-semibold", TONE[tone].text)}>
        {children}
      </Text>
    </View>
  );
}

/**
 * The one mapping from the backend's status words to a colour and a label,
 * so "pending" is amber and "approved" green on every screen.
 */
const STATUS: Record<string, { tone: Tone; label: string }> = {
  pending: { tone: "warning", label: "Pending" },
  submitted: { tone: "warning", label: "Submitted" },
  in_review: { tone: "warning", label: "In review" },
  returned: { tone: "warning", label: "Returned" },
  draft: { tone: "neutral", label: "Draft" },
  queried: { tone: "warning", label: "Queried" },
  reimbursed: { tone: "success", label: "Reimbursed" },
  approved: { tone: "success", label: "Approved" },
  accepted: { tone: "success", label: "Accepted" },
  applied: { tone: "success", label: "Applied" },
  completed: { tone: "success", label: "Completed" },
  paid: { tone: "success", label: "Paid" },
  active: { tone: "success", label: "Active" },
  present: { tone: "success", label: "Present" },
  partial: { tone: "warning", label: "Partial" },
  absent: { tone: "danger", label: "Absent" },
  on_leave: { tone: "info", label: "On leave" },
  holiday: { tone: "info", label: "Holiday" },
  rest_day: { tone: "neutral", label: "Rest day" },
  rejected: { tone: "danger", label: "Rejected" },
  failed: { tone: "danger", label: "Failed" },
  blocked: { tone: "danger", label: "Blocked" },
  expired: { tone: "neutral", label: "Expired" },
  cancelled: { tone: "neutral", label: "Withdrawn" },
  withdrawn: { tone: "neutral", label: "Withdrawn" },
};

export function statusTone(status: string | null | undefined): Tone {
  return STATUS[status ?? ""]?.tone ?? "neutral";
}

export function statusLabel(status: string | null | undefined): string {
  if (!status) return "—";
  return STATUS[status]?.label ?? status.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

export function StatusBadge({ status, className }: { status: string | null | undefined; className?: string }) {
  return (
    <Badge tone={statusTone(status)} className={className}>
      {statusLabel(status)}
    </Badge>
  );
}

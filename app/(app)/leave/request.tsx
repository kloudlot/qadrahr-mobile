import { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { router } from "expo-router";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Field";
import { ScreenHeader } from "@/components/ui/Header";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { toast } from "@/components/ui/Toast";
import { isoDate } from "@/lib/format";
import { ErrorView, LoadingView } from "@/components/state/StateViews";
import { errorMessage } from "@/lib/api";
import { useMyCompany } from "@/lib/queries/company";
import { useMyProfile } from "@/lib/queries/profile";
import { useNextHolidays } from "@/lib/queries/home";
import { useEntitlements, useLeaveTypes, useRequestLeave } from "@/lib/queries/leave";
import { addDays, dayOfWeek, excludedDates, previewDays } from "@/lib/workingDays";
import { formatDays } from "@/components/leave/BalanceBar";
import { DateRangeStrip } from "@/components/leave/DateRangeStrip";
import { HandoverPicker } from "@/components/leave/HandoverPicker";

/**
 * Request leave — screen 05.
 *
 * The whole point of this screen is the line that says what the request
 * will cost and what it leaves behind. Someone booking a week off is
 * making a decision about their remaining balance, and finding out
 * afterwards is the failure this prevents.
 *
 * Both figures are PREVIEWS. The server recomputes on submit and is the
 * only authority — see lib/workingDays.ts. They match the server's
 * algorithm exactly, which is why the screen needs the company's working
 * days and the holiday calendar before it can show anything.
 */
export default function RequestLeaveScreen() {
  // The LOCAL date: toISOString is UTC, which is yesterday just after
  // midnight anywhere east of Greenwich.
  const today = useMemo(() => isoDate(new Date()), []);
  const year = useMemo(() => Number(today.slice(0, 4)), [today]);

  const types = useLeaveTypes();
  const company = useMyCompany();
  const holidays = useNextHolidays(year);
  const profile = useMyProfile();
  const submit = useRequestLeave();

  const [leaveTypeId, setLeaveTypeId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [halfDayStart, setHalfDayStart] = useState(false);
  const [halfDayEnd, setHalfDayEnd] = useState(false);
  const [reason, setReason] = useState("");
  const [handoverToId, setHandoverToId] = useState<string | null>(null);
  const [editing, setEditing] = useState<"from" | "to">("from");

  // The balance the request draws on is the one for the year it starts in —
  // late-December requests for January leave draw on next year's.
  const entitlements = useEntitlements(Number(startDate.slice(0, 4)));

  const loading = types.isLoading || company.isLoading || holidays.isLoading || profile.isLoading;
  const loadError = types.error ?? company.error ?? holidays.error ?? profile.error;

  const selectedType = (types.data ?? []).find((type) => type._id === leaveTypeId) ?? null;
  const balance = (entitlements.data ?? []).find((row) => row.leaveTypeId === leaveTypeId) ?? null;

  // As the server picks them: company-wide, or declared for this person's
  // branch. Counting another state's holiday would preview a day too few.
  const branchId = profile.data?.branchId ?? null;
  const holidayDates = useMemo(
    () =>
      Object.fromEntries(
        (holidays.data ?? [])
          .filter((h) => !h.branchIds?.length || (branchId !== null && h.branchIds.includes(branchId)))
          .map((h) => [h.date, h.name]),
      ),
    [holidays.data, branchId],
  );

  const days = useMemo(() => {
    if (!selectedType) return 0;
    return previewDays({
      startDate,
      endDate,
      workDays: company.data?.workDays,
      holidays: Object.keys(holidayDates),
      // From the leave type, as the server reads it: maternity and similar
      // run in calendar days. (Hard-coded true while the type was trimmed,
      // which previewed those in working days — fewer than recorded.)
      excludesNonWorkingDays: selectedType.excludesNonWorkingDays,
      allowHalfDays: selectedType.allowHalfDays,
      halfDayStart,
      halfDayEnd,
    });
  }, [selectedType, startDate, endDate, company.data?.workDays, holidayDates, halfDayStart, halfDayEnd]);

  /** Weekends and holidays, for the strip's muted styling. */
  const nonWorkingDates = useMemo(() => {
    const workDays = company.data?.workDays ?? [1, 2, 3, 4, 5];
    const dates = new Set(Object.keys(holidayDates));
    // Ninety days ahead, matching the strip's horizon.
    for (let index = 0; index < 90; index += 1) {
      const date = addDays(today, index);
      if (!workDays.includes(dayOfWeek(date))) dates.add(date);
    }
    return dates;
  }, [company.data?.workDays, holidayDates, today]);

  const excluded = useMemo(
    () =>
      excludedDates(startDate, endDate, {
        workDays: company.data?.workDays,
        holidays: holidayDates,
      }),
    [startDate, endDate, company.data?.workDays, holidayDates],
  );

  // The strip cannot produce a reversed range, so there is no error
  // state for one — it swaps the ends instead.
  const canSubmit = Boolean(leaveTypeId) && days > 0 && !submit.isPending;

  if (loading) {
    return (
      <Screen scroll={false} header={<ScreenHeader title="Request leave" />}>
        <LoadingView label="Loading leave options" />
      </Screen>
    );
  }

  if (loadError) {
    return (
      <Screen scroll={false} header={<ScreenHeader title="Request leave" />}>
        <ErrorView message={errorMessage(loadError)} onRetry={() => void types.refetch()} />
      </Screen>
    );
  }

  return (
    <Screen
      header={<ScreenHeader title="Request leave" subtitle="Your approver sees it straight away" />}
      footer={
        <Button
          label={selectedType && days > 0 ? `Request ${formatDays(days)}` : "Submit request"}
          size="lg"
          block
          haptic
          loading={submit.isPending}
          disabled={!canSubmit}
          onPress={() => {
            if (!leaveTypeId) return;
            submit.mutate(
              {
                leaveTypeId,
                startDate,
                endDate,
                halfDayStart: halfDayStart || undefined,
                halfDayEnd: halfDayEnd || undefined,
                reason: reason.trim() || undefined,
                handoverToId: handoverToId ?? undefined,
              },
              {
                onSuccess: () => {
                  toast.success("Leave requested", "You'll be notified when it's decided.");
                  router.back();
                },
              },
            );
          }}
        />
      }
    >
      <View className="gap-6 pt-2">
        <Field label="Leave type">
          <View className="flex-row flex-wrap gap-2">
            {(types.data ?? []).map((type) => {
              const active = type._id === leaveTypeId;
              return (
                <Pressable
                  key={type._id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  onPress={() => setLeaveTypeId(type._id)}
                  className={`min-h-touch justify-center rounded-pill border px-4 ${
                    active ? "border-brand bg-brand" : "border-border bg-bg-card"
                  }`}
                >
                  <Text variant="small" className={active ? "font-semibold text-brand-ink" : "text-text-primary"}>
                    {type.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Field>

        <Card>
          <DateRangeStrip
            from={startDate}
            to={endDate}
            today={today}
            editing={editing}
            onEditingChange={setEditing}
            onChange={({ from, to }) => {
              setStartDate(from);
              setEndDate(to);
            }}
            nonWorking={nonWorkingDates}
          />
        </Card>

        {selectedType?.allowHalfDays ? (
          <Field label="Half days">
            <View className="flex-row gap-2">
              <Toggle label="First day is a half" value={halfDayStart} onChange={setHalfDayStart} />
              {startDate !== endDate ? (
                <Toggle label="Last day is a half" value={halfDayEnd} onChange={setHalfDayEnd} />
              ) : null}
            </View>
          </Field>
        ) : null}

        {/* The reason the screen exists. */}
        {selectedType ? (
          <View className="gap-2 rounded-2xl bg-brand-subtle p-4">
            <Text variant="micro" className="text-brand">
              This request
            </Text>
            <Text variant="h1" tabular className="text-text-primary">
              {formatDays(days)}
            </Text>

            {excluded.length > 0 ? (
              <Text variant="small" className="text-text-secondary">
                {describeExcluded(excluded)} excluded automatically.
              </Text>
            ) : null}

            {balance ? (
              <Text variant="small" className="text-text-secondary">
                You will have{" "}
                <Text variant="small" className="font-semibold text-text-primary">
                  {formatDays(Math.max(0, balance.available - days))}
                </Text>{" "}
                of {balance.name.toLowerCase()} remaining.
              </Text>
            ) : null}

            {balance && days > balance.available ? (
              // Flagged, not blocked. The server decides, and an employee
              // with a genuine reason to exceed their balance must still
              // be able to ask.
              <Text variant="small" className="text-warning-ink">
                That is more than your balance. You can still request it — your approver will see the
                shortfall.
              </Text>
            ) : null}
          </View>
        ) : null}

        <Field label="Hand over to" hint="Optional. Who covers your work while you're away.">
          <HandoverPicker value={handoverToId} onChange={setHandoverToId} />
        </Field>

        <Field label="Reason" hint="Optional. Your approver sees it." error={submit.isError ? errorMessage(submit.error) : null}>
          <Input
            accessibilityLabel="Reason"
            value={reason}
            onChangeText={setReason}
            multiline
            placeholder="e.g. Family wedding in Ibadan"
          />
        </Field>
      </View>
    </Screen>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      className={`min-h-touch flex-1 justify-center rounded-xl border px-3 ${
        value ? "border-brand bg-brand-subtle" : "border-border bg-bg-card"
      }`}
    >
      <Text variant="small" className={value ? "font-semibold text-brand" : "text-text-primary"}>
        {label}
      </Text>
    </Pressable>
  );
}

/** "Weekends and 1 October" — named where a holiday has a name. */
function describeExcluded(excluded: { date: string; reason: string }[]): string {
  const hasWeekend = excluded.some((entry) => entry.reason === "weekend");
  const holidays = excluded
    .filter((entry) => entry.reason !== "weekend")
    .map((entry) => formatShortDate(entry.date));

  const parts = [hasWeekend ? "Weekends" : null, ...holidays].filter(Boolean) as string[];

  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0] as string;
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

function formatShortDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString([], { day: "numeric", month: "long" });
}

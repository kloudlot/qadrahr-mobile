import { Pressable, ScrollView, View } from "react-native";

import { Text } from "@/components/ui/Text";
import { addDays, dayOfWeek } from "@/lib/workingDays";

/**
 * Picking a date range, as the design draws it: a horizontal strip of
 * days rather than a modal picker.
 *
 * No dependency. `@react-native-community/datetimepicker` was the
 * obvious reach and would have been the wrong one — the design shows a
 * strip, a strip shows the shape of the week (which is the thing
 * someone is actually reasoning about when booking leave), and a
 * platform spinner shows one date at a time with no context at all.
 *
 * Dates are `YYYY-MM-DD` strings throughout. Nothing here constructs a
 * Date from one except to read its weekday, and that goes through
 * `dayOfWeek`, which parses as UTC — see the note in lib/workingDays.ts
 * about why local-time parsing shifts a day west of Greenwich.
 */

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

/** How far ahead someone can book from this strip. */
const HORIZON_DAYS = 90;

export function DateRangeStrip({
  from,
  to,
  today,
  /** Which end the next tap sets. */
  editing,
  onEditingChange,
  onChange,
  nonWorking,
}: {
  from: string;
  to: string;
  today: string;
  editing: "from" | "to";
  onEditingChange: (next: "from" | "to") => void;
  onChange: (next: { from: string; to: string }) => void;
  /** Dates that will not be counted, for the muted styling. */
  nonWorking: Set<string>;
}) {
  const dates = Array.from({ length: HORIZON_DAYS }, (_, index) => addDays(today, index));

  const select = (date: string) => {
    if (editing === "from") {
      // Dragging the start past the end takes the end with it, rather
      // than leaving an impossible range on screen.
      onChange({ from: date, to: date > to ? date : to });
      onEditingChange("to");
      return;
    }
    // A `to` before `from` is the user correcting the start, not an
    // error worth refusing.
    if (date < from) {
      onChange({ from: date, to: from });
      return;
    }
    onChange({ from, to: date });
  };

  return (
    <View className="gap-3">
      <View className="flex-row gap-3">
        <EndButton
          label="From"
          value={from}
          active={editing === "from"}
          onPress={() => onEditingChange("from")}
        />
        <EndButton
          label="To"
          value={to}
          active={editing === "to"}
          onPress={() => onEditingChange("to")}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 6, paddingHorizontal: 2 }}
      >
        {dates.map((date) => {
          const inRange = date >= from && date <= to;
          const isEnd = date === from || date === to;
          const muted = nonWorking.has(date);

          return (
            <Pressable
              key={date}
              accessibilityRole="button"
              accessibilityLabel={describe(date, inRange)}
              accessibilityState={{ selected: inRange }}
              onPress={() => select(date)}
              className={`h-[68px] w-12 items-center justify-center gap-0.5 rounded-2xl border ${
                isEnd
                  ? "border-brand bg-brand"
                  : inRange
                    ? "border-brand-subtle bg-brand-subtle"
                    : "border-border bg-bg-inset"
              }`}
            >
              <Text
                variant="caption"
                className={
                  isEnd ? "text-brand-ink" : muted ? "text-text-disabled" : "text-text-secondary"
                }
              >
                {WEEKDAY_LABELS[dayOfWeek(date)]}
              </Text>
              <Text
                variant="body"
                tabular
                className={
                  isEnd
                    ? "font-semibold text-brand-ink"
                    : muted
                      ? "text-text-disabled"
                      : "text-text-primary"
                }
              >
                {Number(date.slice(8, 10))}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function EndButton({
  label,
  value,
  active,
  onPress,
}: {
  label: string;
  value: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      className={`min-h-[52px] flex-1 justify-center rounded-xl border px-4 ${
        active ? "border-brand bg-brand-subtle" : "border-border bg-bg-card"
      }`}
    >
      <Text variant="micro" className="text-text-secondary">
        {label}
      </Text>
      <Text variant="body" className="font-medium text-text-primary">
        {formatLong(value)}
      </Text>
    </Pressable>
  );
}

function describe(date: string, inRange: boolean): string {
  return `${formatLong(date)}${inRange ? ", selected" : ""}`;
}

/** `Mon 12 Oct`. Parsed as UTC, formatted without a timezone shift. */
export function formatLong(value: string): string {
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString([], {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

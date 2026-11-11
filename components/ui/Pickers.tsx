import { useMemo, useRef, useState, type ReactNode } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { CalendarDays, ChevronLeft, ChevronRight, Clock } from "lucide-react-native";

import { cn } from "@/lib/cn";
import { calendarDate, formatDate, isoDate, monthLabel } from "@/lib/format";
import { useThemeColors } from "@/lib/theme/ThemeProvider";
import { Button, IconButton } from "./Button";
import { Sheet } from "./Sheet";
import { Text } from "./Text";

/**
 * Date and time input without a native picker dependency: the same on iOS
 * and Android, themed, and large enough to hit with a thumb.
 */

/** The last `days` days as tappable chips, today at the right. */
export function DayStrip({
  value,
  onChange,
  days = 30,
}: {
  value: string | null;
  onChange: (date: string) => void;
  days?: number;
}) {
  const scroll = useRef<ScrollView>(null);
  const dates = useMemo(() => {
    const today = new Date();
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (days - 1 - i));
      return isoDate(d);
    });
  }, [days]);

  return (
    <ScrollView
      ref={scroll}
      horizontal
      showsHorizontalScrollIndicator={false}
      onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}
      contentContainerStyle={{ gap: 8 }}
    >
      {dates.map((date) => {
        const d = calendarDate(date);
        const active = date === value;
        return (
          <Pressable
            key={date}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={formatDate(date)}
            onPress={() => onChange(date)}
            className={cn(
              "h-[68px] w-14 items-center justify-center gap-0.5 rounded-2xl border",
              active ? "border-brand bg-brand" : "border-border bg-bg-card",
            )}
          >
            <Text variant="caption" className={active ? "text-brand-ink" : "text-text-secondary"}>
              {d.toLocaleDateString([], { weekday: "short" })}
            </Text>
            <Text variant="h3" tabular className={active ? "text-brand-ink" : "text-text-primary"}>
              {d.getDate()}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const HOURS = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

/** `HH:mm`, chosen from an hour grid and a five-minute grid. */
export function TimeField({
  value,
  onChange,
  placeholder = "Choose a time",
}: {
  value: string | null;
  onChange: (time: string) => void;
  placeholder?: string;
}) {
  const colors = useThemeColors();
  const [open, setOpen] = useState(false);
  const [hour, setHour] = useState(value?.slice(0, 2) ?? "09");
  const [minute, setMinute] = useState(roundMinute(value?.slice(3, 5)));

  return (
    <>
      <FieldButton
        icon={<Clock size={18} color={colors.textSecondary} />}
        label={value ?? placeholder}
        filled={Boolean(value)}
        onPress={() => {
          setHour(value?.slice(0, 2) ?? "09");
          setMinute(roundMinute(value?.slice(3, 5)));
          setOpen(true);
        }}
      />
      <Sheet
        visible={open}
        onClose={() => setOpen(false)}
        title="Choose a time"
        footer={
          <Button
            label={`Use ${hour}:${minute}`}
            size="lg"
            block
            onPress={() => {
              onChange(`${hour}:${minute}`);
              setOpen(false);
            }}
          />
        }
      >
        <Text variant="small" className="font-medium text-text-label">
          Hour
        </Text>
        <Grid items={HOURS} value={hour} onChange={setHour} columns={6} />
        <Text variant="small" className="font-medium text-text-label">
          Minute
        </Text>
        <Grid items={MINUTES} value={minute} onChange={setMinute} columns={6} />
      </Sheet>
    </>
  );
}

function roundMinute(minute: string | undefined): string {
  const n = Number(minute ?? 0);
  return String(Math.min(55, Math.round(n / 5) * 5)).padStart(2, "0");
}

function Grid({
  items,
  value,
  onChange,
  columns,
}: {
  items: string[];
  value: string;
  onChange: (v: string) => void;
  columns: number;
}) {
  return (
    <View className="flex-row flex-wrap" style={{ marginHorizontal: -3 }}>
      {items.map((item) => {
        const active = item === value;
        return (
          <View key={item} style={{ width: `${100 / columns}%`, padding: 3 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => onChange(item)}
              className={cn("h-11 items-center justify-center rounded-xl", active ? "bg-brand" : "bg-bg-inset")}
            >
              <Text variant="body" tabular className={cn("font-medium", active ? "text-brand-ink" : "text-text-primary")}>
                {item}
              </Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

/** A calendar in a sheet. `min`/`max` are YYYY-MM-DD, inclusive. */
export function DateField({
  value,
  onChange,
  min,
  max,
  placeholder = "Choose a date",
  title = "Choose a date",
}: {
  value: string | null;
  onChange: (date: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  title?: string;
}) {
  const colors = useThemeColors();
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => calendarDate(value ?? min ?? isoDate(new Date())));

  const cells = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    // Monday-first weeks.
    const lead = (first.getDay() + 6) % 7;
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return [
      ...Array.from({ length: lead }, () => null),
      ...Array.from({ length: count }, (_, i) => isoDate(new Date(month.getFullYear(), month.getMonth(), i + 1))),
    ];
  }, [month]);

  const shift = (delta: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1));

  return (
    <>
      <FieldButton
        icon={<CalendarDays size={18} color={colors.textSecondary} />}
        label={value ? formatDate(value) : placeholder}
        filled={Boolean(value)}
        onPress={() => {
          setMonth(calendarDate(value ?? min ?? isoDate(new Date())));
          setOpen(true);
        }}
      />
      <Sheet visible={open} onClose={() => setOpen(false)} title={title}>
        <View className="flex-row items-center justify-between">
          <IconButton icon={ChevronLeft} label="Previous month" onPress={() => shift(-1)} />
          <Text variant="h3" className="text-text-primary">
            {monthLabel(month)}
          </Text>
          <IconButton icon={ChevronRight} label="Next month" onPress={() => shift(1)} />
        </View>
        <View className="flex-row">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <Text key={i} variant="caption" className="flex-1 text-center text-text-secondary">
              {d}
            </Text>
          ))}
        </View>
        <View className="flex-row flex-wrap">
          {cells.map((date, i) => {
            if (!date) return <View key={`lead-${i}`} style={{ width: "14.2857%", height: 44 }} />;
            const disabled = (min && date < min) || (max && date > max);
            const active = date === value;
            return (
              <View key={date} style={{ width: "14.2857%", padding: 2 }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: active, disabled: Boolean(disabled) }}
                  accessibilityLabel={formatDate(date)}
                  disabled={Boolean(disabled)}
                  onPress={() => {
                    onChange(date);
                    setOpen(false);
                  }}
                  className={cn("h-11 items-center justify-center rounded-full", active && "bg-brand")}
                >
                  <Text
                    variant="body"
                    tabular
                    className={cn(active ? "font-semibold text-brand-ink" : disabled ? "text-text-disabled" : "text-text-primary")}
                  >
                    {Number(date.slice(8))}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      </Sheet>
    </>
  );
}

function FieldButton({
  icon,
  label,
  filled,
  onPress,
}: {
  icon: ReactNode;
  label: string;
  filled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="h-12 flex-row items-center gap-3 rounded-xl bg-bg-inset px-4 active:opacity-80"
    >
      {icon}
      <Text variant="body" tabular className={filled ? "text-text-primary" : "text-text-disabled"}>
        {label}
      </Text>
    </Pressable>
  );
}

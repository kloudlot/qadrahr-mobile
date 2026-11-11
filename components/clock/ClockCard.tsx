import { View } from "react-native";

import { Circle, CircleDot, CloudUpload, LogIn, LogOut, MapPin, TriangleAlert } from "lucide-react-native";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Text } from "@/components/ui/Text";
import { useThemeColors } from "@/lib/theme/ThemeProvider";

import type { PositionState } from "@/lib/useCurrentPosition";
import type { MyShift, WorkLocation } from "@/lib/queries/attendance";

/**
 * The clock widget — the reason the app exists.
 *
 * The button sits in the lower half and is 60px, not because the design
 * says so arbitrarily but because it is pressed with a thumb, outdoors,
 * often in a hurry and sometimes in the rain.
 */
export function ClockCard({
  clockedIn,
  elapsedMinutes,
  progress,
  openedAt,
  shift,
  position,
  workLocation,
  pendingOffline,
  saving = false,
  warning,
  isPunching,
  onPunch,
}: {
  clockedIn: boolean;
  elapsedMinutes: number;
  progress: number;
  openedAt: string | null;
  shift: MyShift | undefined;
  position: PositionState;
  workLocation: WorkLocation | undefined;
  pendingOffline: boolean;
  saving?: boolean;
  warning: string | null;
  isPunching: boolean;
  onPunch: () => void;
}) {
  const colors = useThemeColors();

  return (
    <Card className="gap-5 p-5">
      <View className="flex-row items-center justify-between">
        <Badge tone={clockedIn ? "success" : "neutral"} icon={clockedIn ? CircleDot : Circle}>
          {clockedIn && openedAt
            ? `In since ${formatTime(openedAt)}`
            : clockedIn
              ? "Clocked in"
              : "Not clocked in"}
        </Badge>
        <Text variant="caption" className="text-text-secondary">
          {new Date().toLocaleDateString([], { weekday: "long", day: "numeric", month: "short" })}
        </Text>
      </View>

      {/* Capped at 1 inside the ring, so overtime fills it rather than
          wrapping round and reading as a fresh day. */}
      <View className="items-center">
        <ProgressRing size={196} stroke={12} progress={progress} color={colors.brand} trackColor={colors.inset}>
          <Text variant="micro" className="text-text-secondary">
            {clockedIn ? "Worked today" : "Today"}
          </Text>
          <Text tabular className="mt-1 font-bold text-text-primary" style={{ fontSize: 36, lineHeight: 42 }}>
            {formatElapsed(elapsedMinutes)}
          </Text>
          {/* Named, or honest about not knowing. The previous version said
              "of 8h 00m — standard day" to everyone, including part-time
              staff whose day it was not. */}
          <Text variant="caption" numberOfLines={2} className="mt-1 max-w-[140px] text-center text-text-secondary">
            {describeSchedule(shift)}
          </Text>
        </ProgressRing>
      </View>

      <LocationPill
        clockedIn={clockedIn}
        position={position}
        workLocation={workLocation}
        pendingOffline={pendingOffline}
        saving={saving}
      />

      {warning ? (
        // The punch SUCCEEDED and was flagged. Inline, never a sheet — a
        // modal here would tell someone their clock-in failed when it
        // did not.
        <View className="flex-row gap-2 rounded-xl bg-warning-subtle p-3">
          <TriangleAlert size={18} color={colors.warning} />
          <Text variant="small" className="flex-1 text-warning-ink">
            {warning}
          </Text>
        </View>
      ) : null}

      <Button
        label={clockedIn ? "Clock out" : "Clock in"}
        variant={clockedIn ? "danger" : "primary"}
        size="lg"
        icon={clockedIn ? LogOut : LogIn}
        haptic
        block
        loading={isPunching}
        onPress={onPunch}
        className="min-h-[58px]"
      />
    </Card>
  );
}

/**
 * What the elapsed figure is measured against.
 *
 * Three cases, and the third is why this exists: an employee nobody has
 * rostered has no scheduled day, and saying "of 8h 00m" to them is a
 * quiet fiction. The bar still renders — it needs some scale — but the
 * caption does not claim the number is theirs.
 */
function describeSchedule(shift: MyShift | undefined): string {
  if (!shift || shift.scheduledMinutes === null) return "No shift scheduled";
  if (!shift.worksToday)
    return `Not scheduled today · ${shift.name ?? "shift"}`;
  return `of ${formatElapsed(shift.scheduledMinutes)}${shift.name ? ` — ${shift.name}` : ""}`;
}

function LocationPill({
  clockedIn,
  position,
  workLocation,
  pendingOffline,
  saving,
}: {
  clockedIn: boolean;
  position: PositionState;
  workLocation: WorkLocation | undefined;
  pendingOffline: boolean;
  saving: boolean;
}) {
  const { tone, label } = describeLocation({
    clockedIn,
    position,
    workLocation,
    pendingOffline,
    saving,
  });

  const colors = useThemeColors();
  const TONES = {
    ok: { box: "bg-success-subtle", text: "text-success-ink", icon: colors.success },
    waiting: { box: "bg-bg-inset", text: "text-text-secondary", icon: colors.textSecondary },
    warn: { box: "bg-warning-subtle", text: "text-warning-ink", icon: colors.warning },
  } as const;

  return (
    <View className="items-center">
      <View className={`flex-row items-center gap-1.5 rounded-pill px-3 py-1.5 ${TONES[tone].box}`}>
        {pendingOffline ? <CloudUpload size={14} color={TONES[tone].icon} /> : <MapPin size={14} color={TONES[tone].icon} />}
        <Text variant="caption" numberOfLines={1} className={`font-medium ${TONES[tone].text}`}>
          {label}
        </Text>
      </View>
    </View>
  );
}

function describeLocation({
  clockedIn,
  position,
  workLocation,
  pendingOffline,
  saving,
}: {
  clockedIn: boolean;
  position: PositionState;
  workLocation: WorkLocation | undefined;
  pendingOffline: boolean;
  saving: boolean;
}): { tone: "ok" | "waiting" | "warn"; label: string } {
  // A queued punch takes precedence over everything else on this line.
  // The employee's question at that moment is "did it save", not "where
  // am I".
  if (pendingOffline) return { tone: "warn", label: "Waiting to sync" };
  if (saving) return { tone: "waiting", label: "Saving…" };

  const branch = workLocation?.name;

  switch (position.status) {
    case "locating":
      return { tone: "waiting", label: "Finding your location" };

    case "disabled":
      return { tone: "warn", label: "Location is off" };

    case "denied":
      return { tone: "warn", label: "Location not allowed" };

    case "unavailable":
      return { tone: "warn", label: "No location yet" };

    case "ready":
      return {
        tone: clockedIn ? "ok" : "waiting",
        label: branch
          ? `${branch} · confirmed ${agoLabel(position.acquiredAt)}`
          : `Location confirmed ${agoLabel(position.acquiredAt)}`,
      };
  }
}

/**
 * Rendered once per position fix, not ticked.
 *
 * "confirmed 4s ago" that counts upward draws the eye to the one number
 * on the screen that does not matter, and re-rendering the card every
 * second to say so would be worse.
 */
function agoLabel(acquiredAt: number | null): string {
  if (!acquiredAt) return "just now";
  const seconds = Math.max(0, Math.round((Date.now() - acquiredAt) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  return `${Math.round(seconds / 60)}m ago`;
}

/** `8h 12m`. Tabular figures, so the digits do not jitter as it ticks. */
function formatElapsed(minutes: number): string {
  const whole = Math.max(0, Math.floor(minutes));
  return `${Math.floor(whole / 60)}h ${String(whole % 60).padStart(2, "0")}m`;
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

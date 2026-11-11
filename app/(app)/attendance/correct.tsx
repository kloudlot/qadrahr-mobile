import { useState, type ReactNode } from "react";
import { Pressable, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowDownLeft, ArrowUpRight, Check } from "lucide-react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Field";
import { ScreenHeader } from "@/components/ui/Header";
import { DayStrip, TimeField } from "@/components/ui/Pickers";
import { Screen } from "@/components/ui/Screen";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Skeleton } from "@/components/ui/Skeleton";
import { Text } from "@/components/ui/Text";
import { toast } from "@/components/ui/Toast";
import { errorMessage } from "@/lib/api";
import { cn } from "@/lib/cn";
import { formatTime, instantFrom, isoDate } from "@/lib/format";
import { usePunches } from "@/lib/queries/attendance";
import { useRequestCorrection, type CorrectionKind } from "@/lib/queries/corrections";
import { useThemeColors } from "@/lib/theme/ThemeProvider";

/**
 * Asking for a punch to be fixed: one that was missed, or one recorded at
 * the wrong time. Goes to the manager; nothing changes until they approve.
 */
export default function CorrectPunchScreen() {
  const params = useLocalSearchParams<{ date?: string }>();
  const colors = useThemeColors();
  const [kind, setKind] = useState<CorrectionKind>("missing");
  const [date, setDate] = useState<string>(params.date ?? isoDate(new Date()));
  const [direction, setDirection] = useState<"in" | "out">("out");
  const [punchId, setPunchId] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const punches = usePunches(date);
  const correctable = [...(punches.data ?? [])]
    .filter((p) => !p.supersededByCorrection)
    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
  const request = useRequestCorrection();

  const ready = Boolean(time && reason.trim() && (kind === "missing" || punchId));

  const submit = () => {
    if (!time) return;
    const occurredAt = instantFrom(date, time);
    if (Date.parse(occurredAt) > Date.now()) {
      setError("That time hasn't happened yet.");
      return;
    }
    setError(null);
    request.mutate(
      {
        kind,
        occurredAt,
        reason: reason.trim(),
        ...(kind === "missing" ? { direction } : { punchId: punchId ?? undefined }),
      },
      {
        onSuccess: () => {
          toast.success("Sent for approval", "Your manager will review it.");
          router.back();
        },
        onError: (e) => setError(errorMessage(e)),
      },
    );
  };

  return (
    <Screen
      header={<ScreenHeader title="Fix a punch" subtitle="Your manager approves it first" />}
      footer={
        <Button label="Send for approval" size="lg" block haptic disabled={!ready} loading={request.isPending} onPress={submit} />
      }
    >
      <View className="gap-6 pt-2">
        <SegmentedControl
          value={kind}
          onChange={(value) => {
            setKind(value);
            setPunchId(null);
            setTime(null);
          }}
          options={[
            { value: "missing", label: "I missed a punch" },
            { value: "correct", label: "A time is wrong" },
          ]}
        />

        <Field label="Which day">
          <DayStrip
            value={date}
            onChange={(value) => {
              setDate(value);
              setPunchId(null);
            }}
          />
        </Field>

        {kind === "missing" ? (
          <>
            <Field label="Which punch">
              <View className="flex-row gap-3">
                <Choice
                  active={direction === "in"}
                  label="Clock in"
                  icon={<ArrowDownLeft size={18} color={direction === "in" ? colors.onBrand : colors.success} />}
                  onPress={() => setDirection("in")}
                />
                <Choice
                  active={direction === "out"}
                  label="Clock out"
                  icon={<ArrowUpRight size={18} color={direction === "out" ? colors.onBrand : colors.brand} />}
                  onPress={() => setDirection("out")}
                />
              </View>
            </Field>
            <Field label="What time" required>
              <TimeField value={time} onChange={setTime} />
            </Field>
          </>
        ) : (
          <>
            <Field label="Which punch is wrong" required>
              {punches.isLoading ? (
                <Skeleton height={52} radius={12} />
              ) : correctable.length === 0 ? (
                <Card>
                  <Text variant="small" className="text-text-secondary">
                    Nothing was recorded that day. Choose &quot;I missed a punch&quot; instead.
                  </Text>
                </Card>
              ) : (
                <View className="gap-2">
                  {correctable.map((p) => {
                    const active = punchId === p._id;
                    return (
                      <Pressable
                        key={p._id}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        onPress={() => {
                          setPunchId(p._id);
                          setTime(formatTime(p.occurredAt));
                        }}
                        className={cn(
                          "min-h-[52px] flex-row items-center gap-3 rounded-xl border px-4",
                          active ? "border-brand bg-brand-subtle" : "border-border bg-bg-card",
                        )}
                      >
                        <Text variant="body" tabular className="font-semibold text-text-primary">
                          {formatTime(p.occurredAt)}
                        </Text>
                        <Text variant="small" className="flex-1 text-text-secondary">
                          {p.direction === "in" ? "Clock in" : "Clock out"}
                        </Text>
                        {active ? <Check size={20} color={colors.brand} /> : null}
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </Field>
            {punchId ? (
              <Field label="The right time" required>
                <TimeField value={time} onChange={setTime} />
              </Field>
            ) : null}
          </>
        )}

        <Field label="Reason" required hint="Your manager sees this." error={error}>
          <Input
            value={reason}
            onChangeText={setReason}
            placeholder="e.g. Forgot to clock out — left at 17:05"
            multiline
            maxLength={500}
          />
        </Field>
      </View>
    </Screen>
  );
}

function Choice({
  active,
  label,
  icon,
  onPress,
}: {
  active: boolean;
  label: string;
  icon: ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      className={cn(
        "h-12 flex-1 flex-row items-center justify-center gap-2 rounded-xl border",
        active ? "border-brand bg-brand" : "border-border bg-bg-card",
      )}
    >
      {icon}
      <Text variant="body" className={cn("font-semibold", active ? "text-brand-ink" : "text-text-primary")}>
        {label}
      </Text>
    </Pressable>
  );
}

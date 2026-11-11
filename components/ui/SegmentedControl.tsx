import { Pressable, View } from "react-native";
import * as Haptics from "expo-haptics";

import { cn } from "@/lib/cn";
import { Text } from "./Text";

/** Two to four mutually exclusive views of the same list. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <View accessibilityRole="tablist" className={cn("flex-row rounded-xl bg-bg-inset p-1", className)}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => {
              if (active) return;
              void Haptics.selectionAsync();
              onChange(option.value);
            }}
            className={cn("min-h-[38px] flex-1 flex-row items-center justify-center gap-1.5 rounded-lg", active && "bg-bg-card")}
          >
            <Text variant="small" className={cn("font-semibold", active ? "text-text-primary" : "text-text-secondary")}>
              {option.label}
            </Text>
            {option.count ? (
              <View className={cn("rounded-pill px-1.5", active ? "bg-brand" : "bg-border")}>
                <Text variant="micro" tabular className={cn(active ? "text-brand-ink" : "text-text-body")}>
                  {option.count}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

import { useState, type ReactNode } from "react";
import { Pressable, TextInput, View, type TextInputProps } from "react-native";
import { Check, ChevronDown } from "lucide-react-native";

import { cn } from "@/lib/cn";
import { useThemeColors } from "@/lib/theme/ThemeProvider";
import { Sheet } from "./Sheet";
import { Text } from "./Text";

/** A label, the control, and a hint or an error under it. */
export function Field({
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <View className={cn("gap-1.5", className)}>
      <Text variant="small" className="font-medium text-text-label">
        {label}
        {required ? <Text className="text-brand"> *</Text> : null}
      </Text>
      {children}
      {error ? (
        <Text variant="caption" className="text-danger">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" className="text-text-secondary">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

/** A text input in the app's style, with a visible focus ring. */
export function Input({ className, multiline, invalid, ...props }: TextInputProps & { className?: string; invalid?: boolean }) {
  const colors = useThemeColors();
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      placeholderTextColor={colors.textDisabled}
      selectionColor={colors.brand}
      multiline={multiline}
      textAlignVertical={multiline ? "top" : "center"}
      onFocus={(event) => {
        setFocused(true);
        props.onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        props.onBlur?.(event);
      }}
      className={cn(
        "rounded-xl border bg-bg-inset px-4 font-sans text-body text-text-primary",
        multiline ? "min-h-[96px] py-3" : "h-12",
        invalid ? "border-danger" : focused ? "border-brand" : "border-transparent",
        className,
      )}
      {...props}
    />
  );
}

/** A select that opens a sheet of options — no native picker, the same on both platforms. */
export function Select<T extends string>({
  value,
  options,
  onChange,
  placeholder = "Choose…",
  title,
}: {
  value: T | null;
  options: { value: T; label: string; detail?: string }[];
  onChange: (value: T) => void;
  placeholder?: string;
  /** The sheet's title. */
  title: string;
}) {
  const colors = useThemeColors();
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title}: ${selected?.label ?? placeholder}`}
        onPress={() => setOpen(true)}
        className="h-12 flex-row items-center justify-between rounded-xl bg-bg-inset px-4 active:opacity-80"
      >
        <Text variant="body" numberOfLines={1} className={selected ? "text-text-primary" : "text-text-disabled"}>
          {selected?.label ?? placeholder}
        </Text>
        <ChevronDown size={18} color={colors.textSecondary} />
      </Pressable>

      <Sheet visible={open} onClose={() => setOpen(false)} title={title}>
        <View className="-mx-screen-x">
          {options.map((option) => {
            const active = option.value === value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className="min-h-[52px] flex-row items-center gap-3 px-screen-x py-2 active:bg-bg-inset"
              >
                <View className="flex-1">
                  <Text variant="body" className={cn(active ? "font-semibold text-brand" : "text-text-primary")}>
                    {option.label}
                  </Text>
                  {option.detail ? (
                    <Text variant="caption" className="text-text-secondary">
                      {option.detail}
                    </Text>
                  ) : null}
                </View>
                {active ? <Check size={20} color={colors.brand} /> : null}
              </Pressable>
            );
          })}
        </View>
      </Sheet>
    </>
  );
}

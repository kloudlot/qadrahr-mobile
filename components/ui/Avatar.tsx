import { View } from "react-native";

import { cn } from "@/lib/cn";
import { Text } from "./Text";

/** Initials in a circle. `onBrand` sits on the hero header. */
export function Avatar({
  name,
  size = 44,
  tone = "default",
  className,
}: {
  name: string | null | undefined;
  size?: number;
  tone?: "default" | "onBrand";
  className?: string;
}) {
  const initials =
    (name ?? "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?";

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      className={cn(
        "items-center justify-center rounded-full",
        tone === "onBrand" ? "border-2 border-white/40 bg-white/20" : "bg-brand-subtle",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Text
        className={cn("font-semibold", tone === "onBrand" ? "text-brand-ink" : "text-brand")}
        style={{ fontSize: size * 0.38, lineHeight: size * 0.5 }}
      >
        {initials}
      </Text>
    </View>
  );
}

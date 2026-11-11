import { ActivityIndicator, View } from "react-native";
import { CloudOff, Inbox, type LucideIcon } from "lucide-react-native";

import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { cn } from "@/lib/cn";
import { useThemeColors } from "@/lib/theme/ThemeProvider";

/**
 * The three states every data screen has besides "here it is".
 *
 * Kept deliberately plain so each screen's loading, failure and emptiness
 * read the same way — and so none of them is ever a blank page.
 */

export function LoadingView({ label = "Loading" }: { label?: string }) {
  const colors = useThemeColors();
  return (
    <View className="flex-1 items-center justify-center gap-3 py-12">
      <ActivityIndicator accessibilityLabel={label} color={colors.brand} />
      <Text variant="small" className="text-text-secondary">
        {label}
      </Text>
    </View>
  );
}

function StateIcon({ icon: Icon, tone }: { icon: LucideIcon; tone: "brand" | "danger" }) {
  const colors = useThemeColors();
  return (
    <View
      className={cn(
        "mb-1 h-16 w-16 items-center justify-center rounded-full",
        tone === "brand" ? "bg-brand-subtle" : "bg-danger-subtle",
      )}
    >
      <Icon size={28} color={tone === "brand" ? colors.brand : colors.danger} />
    </View>
  );
}

export function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View className="flex-1 items-center justify-center gap-2 px-6 py-12">
      <StateIcon icon={CloudOff} tone="danger" />
      <Text variant="h3" className="text-center text-text-primary">
        That didn&apos;t work
      </Text>
      <Text variant="small" className="text-center text-text-secondary">
        {message}
      </Text>
      {onRetry ? <Button label="Try again" variant="secondary" onPress={onRetry} className="mt-3" /> : null}
    </View>
  );
}

export function EmptyView({
  title,
  detail,
  action,
  icon = Inbox,
  compact = false,
}: {
  title: string;
  detail?: string;
  action?: { label: string; onPress: () => void };
  icon?: LucideIcon;
  /** Inside a card, rather than filling the screen. */
  compact?: boolean;
}) {
  return (
    <View className={cn("items-center justify-center gap-2 px-6", compact ? "py-6" : "flex-1 py-12")}>
      <StateIcon icon={icon} tone="brand" />
      <Text variant="h3" className="text-center text-text-primary">
        {title}
      </Text>
      {detail ? (
        <Text variant="small" className="text-center text-text-secondary">
          {detail}
        </Text>
      ) : null}
      {action ? <Button label={action.label} onPress={action.onPress} className="mt-3" /> : null}
    </View>
  );
}

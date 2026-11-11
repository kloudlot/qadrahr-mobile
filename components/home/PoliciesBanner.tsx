import { View } from "react-native";
import { router } from "expo-router";
import { ChevronRight, ScrollText } from "lucide-react-native";

import { Card } from "@/components/ui/Card";
import { Text } from "@/components/ui/Text";
import { useModules } from "@/lib/queries/modules";
import { useOutstandingPolicies } from "@/lib/queries/workplace";
import { useThemeColors } from "@/lib/theme/ThemeProvider";

/**
 * "You have policies to accept", on Home, as the web overview has it.
 * Nothing at all when there are none, or the employer doesn't use
 * policies — Home stays quiet.
 */
export function PoliciesBanner() {
  const colors = useThemeColors();
  const { has } = useModules();
  const policies = useOutstandingPolicies(has("employee_relations"));
  const count = policies.data?.length ?? 0;
  if (count === 0) return null;

  return (
    <Card
      className="flex-row items-center gap-3 bg-warning-subtle p-4"
      onPress={() => router.push("/policies")}
      accessibilityLabel={`${count} ${count === 1 ? "policy" : "policies"} to read and accept`}
    >
      <ScrollText size={20} color={colors.warning} />
      <View className="flex-1">
        <Text variant="small" className="text-warning-ink">
          You have{" "}
          <Text variant="small" className="font-semibold text-warning-ink">
            {count} {count === 1 ? "policy" : "policies"}
          </Text>{" "}
          to read and accept.
        </Text>
      </View>
      <ChevronRight size={18} color={colors.warning} />
    </Card>
  );
}

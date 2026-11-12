import { View } from "react-native";
import { router } from "expo-router";
import { ChevronRight, ScanFace } from "lucide-react-native";

import { Card } from "@/components/ui/Card";
import { Text } from "@/components/ui/Text";
import { needsSetup } from "@/lib/face";
import { useFaceStatus } from "@/lib/queries/face";
import { useThemeColors } from "@/lib/theme/ThemeProvider";

/**
 * "Set up your face check", on Home, under the clock card.
 *
 * Shown only while there is something for the employee to do: their
 * organisation asks for a face at clock-in and they have not agreed, or
 * have agreed and not enrolled. Until they do, clocking in still works —
 * each clock-in is marked for their supervisor — so this is a prompt, not
 * a gate. Nothing at all otherwise: Home stays quiet.
 */
export function FaceSetupBanner() {
  const colors = useThemeColors();
  const status = useFaceStatus();
  if (!needsSetup(status.data)) return null;

  return (
    <Card
      className="flex-row items-center gap-3 bg-warning-subtle p-4"
      onPress={() => router.push("/face")}
      accessibilityLabel="Set up your face check"
    >
      <ScanFace size={20} color={colors.warning} />
      <View className="flex-1">
        <Text variant="small" className="text-warning-ink">
          <Text variant="small" className="font-semibold text-warning-ink">
            Set up your face check.
          </Text>{" "}
          Until you do, your clock-ins are marked for review.
        </Text>
      </View>
      <ChevronRight size={18} color={colors.warning} />
    </Card>
  );
}

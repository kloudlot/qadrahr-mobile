import { View } from "react-native";
import { router } from "expo-router";
import { Clock, UserPen } from "lucide-react-native";

import { ErrorView } from "@/components/state/StateViews";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ScreenHeader } from "@/components/ui/Header";
import { DetailRow, Section } from "@/components/ui/List";
import { Screen } from "@/components/ui/Screen";
import { SkeletonList } from "@/components/ui/Skeleton";
import { Text } from "@/components/ui/Text";
import { toast } from "@/components/ui/Toast";
import { errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { useMyProfile, useProfileChanges, useWithdrawProfileChange } from "@/lib/queries/profile";
import { useThemeColors } from "@/lib/theme/ThemeProvider";

/** My record, as HR holds it — and any change I've asked for that is still being decided. */
export default function ProfileScreen() {
  const colors = useThemeColors();
  const profile = useMyProfile();
  const changes = useProfileChanges();
  const withdraw = useWithdrawProfileChange();

  const pending = (changes.data ?? []).find((c) => c.status === "pending");
  const p = profile.data;

  return (
    <Screen
      header={<ScreenHeader title="Profile" subtitle="Your record, as HR holds it" />}
      footer={
        <Button
          label={pending ? "A change is being reviewed" : "Request a change"}
          icon={UserPen}
          size="lg"
          block
          disabled={Boolean(pending)}
          onPress={() => router.push("/profile/edit")}
        />
      }
    >
      {profile.isLoading ? (
        <SkeletonList rows={5} />
      ) : profile.error || !p ? (
        <ErrorView message={errorMessage(profile.error)} onRetry={() => void profile.refetch()} />
      ) : (
        <View className="gap-6 pt-2">
          {pending ? (
            <View className="gap-2 rounded-2xl bg-warning-subtle p-4">
              <View className="flex-row items-center gap-2">
                <Clock size={18} color={colors.warning} />
                <Text variant="small" className="flex-1 font-semibold text-warning-ink">
                  Change waiting for approval
                </Text>
              </View>
              <Text variant="small" className="text-warning-ink">
                {Object.keys(pending.changes)
                  .map((field) => LABELS[field] ?? field)
                  .join(", ")}{" "}
                — requested {formatDate(pending.createdAt)}. Nothing changes on your record until it&apos;s approved.
              </Text>
              <Button
                label="Withdraw it"
                variant="ghost"
                className="self-start px-0"
                loading={withdraw.isPending}
                onPress={() =>
                  withdraw.mutate(pending._id, {
                    onSuccess: () => toast.success("Change withdrawn"),
                    onError: (error) => toast.error("Couldn't withdraw it", errorMessage(error)),
                  })
                }
              />
            </View>
          ) : null}

          <Section title="Contact">
            <Card padded={false} className="px-4 py-1">
              <DetailRow label="Work email" value={p.workEmail} />
              <DetailRow label="Personal email" value={p.personalEmail || "—"} />
              <DetailRow label="Phone" value={p.phone || "—"} />
              <DetailRow label="Other phone" value={p.alternatePhone || "—"} />
              <DetailRow label="Address" value={p.residentialAddress || "—"} />
              <DetailRow label="Marital status" value={capitalise(p.maritalStatus)} />
            </Card>
          </Section>

          <Section title="Next of kin">
            <Card padded={false} className="px-4 py-1">
              {p.nextOfKin ? (
                <>
                  <DetailRow label="Name" value={p.nextOfKin.name} />
                  <DetailRow label="Relationship" value={p.nextOfKin.relationship} />
                  <DetailRow label="Phone" value={p.nextOfKin.phone} />
                </>
              ) : (
                <DetailRow label="Not recorded" value="—" />
              )}
            </Card>
          </Section>

          <Section title="Bank">
            <Card padded={false} className="px-4 py-1">
              {p.bank ? (
                <>
                  <DetailRow label="Account name" value={p.bank.accountName} />
                  {/* Masked: the number is on the screen of a phone that
                      is shown to people. */}
                  <DetailRow label="Account number" value={`•••• ${p.bank.accountNumber.slice(-4)}`} />
                </>
              ) : (
                <DetailRow label="Not recorded" value="—" />
              )}
            </Card>
          </Section>

          <Section title="Employment">
            <Card padded={false} className="px-4 py-1">
              <DetailRow label="Employee no." value={p.employeeNumber} />
              <DetailRow label="Role" value={p.designationName || "—"} />
              <DetailRow label="Department" value={p.departmentName || "—"} />
              <DetailRow label="Branch" value={p.branchName || "—"} />
              <DetailRow label="Started" value={formatDate(p.hireDate)} />
              <DetailRow label="Type" value={capitalise(p.employmentType)} />
            </Card>
          </Section>
        </View>
      )}
    </Screen>
  );
}

const LABELS: Record<string, string> = {
  phone: "Phone",
  alternatePhone: "Other phone",
  personalEmail: "Personal email",
  residentialAddress: "Address",
  maritalStatus: "Marital status",
  nextOfKin: "Next of kin",
  dependants: "Dependants",
  bank: "Bank details",
};

function capitalise(value: string | undefined | null): string {
  if (!value) return "—";
  const words = value.replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

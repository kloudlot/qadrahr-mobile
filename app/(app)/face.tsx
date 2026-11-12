import { useState } from "react";
import { Alert, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { ScanFace } from "lucide-react-native";

import { FaceSittingModal } from "@/components/face/FaceSittingModal";
import { ErrorView } from "@/components/state/StateViews";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ScreenHeader } from "@/components/ui/Header";
import { Screen } from "@/components/ui/Screen";
import { SkeletonList } from "@/components/ui/Skeleton";
import { Text } from "@/components/ui/Text";
import { toast } from "@/components/ui/Toast";
import { errorMessage } from "@/lib/api";
import type { FaceStatus, SittingResult } from "@/lib/face";
import {
  faceKeys,
  useFaceStatus,
  useGiveFaceConsent,
  useWithdrawFaceConsent,
} from "@/lib/queries/face";
import { useThemeColors } from "@/lib/theme/ThemeProvider";

/**
 * The face check: agreeing to it, enrolling, and taking it back.
 *
 * The order is the point. Nothing about anyone's face is captured until
 * they have read what it is for and agreed, on this screen, to the wording
 * the server holds — and the same screen is where they withdraw, which
 * deletes it.
 */
export default function FaceScreen() {
  const status = useFaceStatus();

  return (
    <Screen header={<ScreenHeader title="Face check" subtitle="Confirming it's you at clock-in" />}>
      <View className="gap-6 pt-2">
        {status.isLoading ? (
          <SkeletonList rows={3} />
        ) : status.error || !status.data ? (
          <ErrorView message={errorMessage(status.error)} onRetry={() => void status.refetch()} />
        ) : (
          <Body status={status.data} />
        )}
      </View>
    </Screen>
  );
}

function Body({ status }: { status: FaceStatus }) {
  const queryClient = useQueryClient();
  const [enrolling, setEnrolling] = useState(false);

  const onSitting = (result: SittingResult) => {
    setEnrolling(false);
    void queryClient.invalidateQueries({ queryKey: faceKeys.status });
    if (result.kind === "judged" && result.verified) {
      if (result.outcome === "pending_review") toast.info("Sent for review", "HR will take a look before you can use it.");
      else toast.success("Your face check is set up");
    } else if (result.kind === "judged") {
      toast.error("That didn't work", result.message ?? undefined);
    } else if (result.kind === "failed") {
      toast.error("The face check couldn't run", result.message);
    } else if (result.kind === "unavailable") {
      toast.error("Faces can't be checked right now", "Try again in a little while.");
    }
  };

  return (
    <>
      <Standing status={status} onEnrol={() => setEnrolling(true)} />
      {status.consentGiven ? <Withdraw /> : null}
      <FaceSittingModal purpose="enrol" visible={enrolling} onResult={onSitting} />
    </>
  );
}

/** Where the employee stands, and the one thing to do next. */
function Standing({ status, onEnrol }: { status: FaceStatus; onEnrol: () => void }) {
  const colors = useThemeColors();
  const consent = useGiveFaceConsent();

  if (status.state === "needs_consent") {
    return (
      <Card>
        <View className="gap-4">
          <Text variant="h3" className="text-text-primary">
            {status.notice.title}
          </Text>
          {status.notice.paragraphs.map((paragraph) => (
            <Text key={paragraph} variant="body" className="text-text-secondary">
              {paragraph}
            </Text>
          ))}
          <Button
            label="I agree"
            size="lg"
            block
            loading={consent.isPending}
            onPress={() =>
              consent.mutate(status.notice.version, {
                onError: (error) => toast.error("That didn't save", errorMessage(error)),
              })
            }
          />
        </View>
      </Card>
    );
  }

  const { title, body, badge, action } = describe(status);
  return (
    <Card>
      <View className="gap-4">
        <View className="h-14 w-14 items-center justify-center rounded-2xl bg-brand-subtle">
          <ScanFace size={26} color={colors.brand} />
        </View>
        <View className="gap-2">
          {badge ? <Badge tone={badge.tone}>{badge.label}</Badge> : null}
          <Text variant="h3" className="text-text-primary">
            {title}
          </Text>
          <Text variant="body" className="text-text-secondary">
            {body}
          </Text>
        </View>
        {action ? <Button label={action} size="lg" block onPress={onEnrol} /> : null}
      </View>
    </Card>
  );
}

interface Description {
  title: string;
  body: string;
  badge: { label: string; tone: "success" | "warning" | "danger" | "neutral" } | null;
  /** The enrol button's label, when enrolling is what comes next. */
  action: string | null;
}

function describe(status: FaceStatus): Description {
  switch (status.state) {
    case "needs_enrolment":
      return status.enrolment?.status === "rejected"
        ? {
            title: "Your face check needs setting up again",
            body: status.enrolment.reviewNote
              ? `HR turned down the last one: “${status.enrolment.reviewNote}”`
              : "HR turned down the last one.",
            badge: { label: "Turned down", tone: "danger" },
            action: "Set it up again",
          }
        : {
            title: "Set up your face check",
            body: "It takes about a minute. Find somewhere well lit, hold the phone at eye level, and follow the prompts.",
            badge: null,
            action: "Set it up now",
          };
    case "awaiting_review":
      return {
        title: "Waiting for HR",
        body: "Your face check has been sent for review. You can clock in as usual in the meantime; those clock-ins are marked for your supervisor.",
        badge: { label: "In review", tone: "warning" },
        action: null,
      };
    case "ready":
      return {
        title: "Your face check is set up",
        body: "You'll be asked to confirm it's you each time you clock in.",
        badge: { label: "Active", tone: "success" },
        action: "Set it up again",
      };
    default:
      return {
        title: "No face check is asked of you",
        body:
          status.availability.reason === "not_in_plan" || status.state === "unavailable"
            ? "Your organisation doesn't use the face check."
            : "Your organisation hasn't turned the face check on for you.",
        badge: null,
        action: null,
      };
  }
}

/** Taking the agreement back, which deletes the face. Said plainly before it is done. */
function Withdraw() {
  const withdraw = useWithdrawFaceConsent();

  const confirm = () =>
    Alert.alert(
      "Withdraw your agreement?",
      "Your face template and enrolment photos are deleted straight away. You can still clock in; your clock-ins will be marked for your supervisor.",
      [
        { text: "Keep it", style: "cancel" },
        {
          text: "Withdraw",
          style: "destructive",
          onPress: () =>
            withdraw.mutate(undefined, {
              onSuccess: () => toast.success("Your agreement is withdrawn", "Your face data has been deleted."),
              onError: (error) => toast.error("That didn't go through", errorMessage(error)),
            }),
        },
      ],
    );

  return (
    <Button
      label="Withdraw my agreement"
      variant="secondary"
      size="lg"
      block
      loading={withdraw.isPending}
      onPress={confirm}
    />
  );
}

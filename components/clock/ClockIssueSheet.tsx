import { useState } from "react";
import { Linking, View } from "react-native";
import { CircleAlert, CircleCheck, CloudUpload, MapPinOff } from "lucide-react-native";
import { PRODUCT_NAME } from "@/lib/env";

import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { Text } from "@/components/ui/Text";
import { useThemeColors } from "@/lib/theme/ThemeProvider";
import type { ClockIssue } from "@/lib/useClock";

/**
 * Screen 03 — what to do when a clock-in does not go cleanly.
 *
 * The design's rule, and the one thing to preserve if any of this is
 * rewritten: **each state says what to do, never what went wrong.** An
 * employee standing outside a building at 07:58 cannot act on "geofence
 * validation failed"; they can act on "move closer, you're about 340m
 * away".
 *
 * The app's own <Sheet> (a Modal with a slide and drag-to-dismiss) rather
 * than a new dependency. An expo-router route
 * with `presentation: "formSheet"` was considered and rejected: the
 * content here is computed state — a distance, a branch name, a time —
 * not navigation identity, so a route would mean either stale search
 * params or a store mirroring what the card already holds.
 *
 * NONE of these four block the punch. Three are pre-flight confirmations
 * that offer to send it anyway, because the server records and flags
 * rather than refusing — a client stricter than the system it is a
 * client of would be wrong. The fourth is reassurance that a punch is
 * already safe.
 */
export function ClockIssueSheet({
  issue,
  onDismiss,
  onProceed,
}: {
  issue: ClockIssue | null;
  onDismiss: () => void;
  /** Sends the punch regardless of what the pre-flight found. */
  onProceed: () => void;
}) {
  const colors = useThemeColors();
  // Held through the closing slide, so the sheet does not empty itself on
  // the way down. Updated during render (React's "adjusting state when a
  // prop changes" pattern) rather than in an effect or a ref.
  const [shown, setShown] = useState<ClockIssue | null>(issue);
  if (issue && issue !== shown) setShown(issue);
  const content = shown ? describe(shown) : null;

  const tone =
    shown?.kind === "rejected"
      ? { box: "bg-danger-subtle", color: colors.danger }
      : shown?.kind === "queued" || shown?.kind === "already_clocked_in"
        ? { box: "bg-success-subtle", color: colors.success }
        : { box: "bg-warning-subtle", color: colors.warning };

  return (
    <Sheet visible={Boolean(issue)} onClose={onDismiss}>
      {content ? (
        <View className="gap-5">
          <View className="gap-3">
            <View className={`h-14 w-14 items-center justify-center rounded-2xl ${tone.box}`}>
              <IssueIcon kind={shown?.kind} color={tone.color} />
            </View>
            <Text variant="h2" className="text-text-primary">
              {content.title}
            </Text>
            <Text variant="body" className="text-text-secondary">
              {content.body}
            </Text>
          </View>

          <View className="gap-3">
            {content.action ? (
              <Button
                label={content.action.label}
                variant={content.action.variant}
                size="lg"
                block
                onPress={() => {
                  if (content.action?.kind === "settings") {
                    void Linking.openSettings();
                    onDismiss();
                    return;
                  }
                  onProceed();
                }}
              />
            ) : null}
            <Button
              label={content.dismissLabel}
              variant="secondary"
              size="lg"
              block
              onPress={content.dismissKind === "proceed" ? onProceed : onDismiss}
            />
          </View>
        </View>
      ) : null}
    </Sheet>
  );
}

function IssueIcon({ kind, color }: { kind: ClockIssue["kind"] | undefined; color: string }) {
  switch (kind) {
    case "queued":
      return <CloudUpload size={26} color={color} />;
    case "rejected":
      return <CircleAlert size={26} color={color} />;
    case "already_clocked_in":
      return <CircleCheck size={26} color={color} />;
    default:
      return <MapPinOff size={26} color={color} />;
  }
}

interface SheetContent {
  title: string;
  body: string;
  action: { label: string; kind: "proceed" | "settings"; variant: "primary" | "secondary" } | null;
  dismissLabel: string;
  /** Whether the secondary button closes, or sends the punch anyway. */
  dismissKind: "close" | "proceed";
}

function describe(issue: ClockIssue): SheetContent {
  switch (issue.kind) {
    case "outside_geofence":
      return {
        title: `You're about ${issue.metres}m from ${issue.branchName}`,
        body: "Move closer to clock in there, or record this as a remote clock-in — your manager will see where it was taken.",
        action: { label: "Clock in anyway", kind: "proceed", variant: "primary" },
        dismissLabel: "I'll move closer",
        dismissKind: "close",
      };

    case "location_off":
      return {
        title:
          issue.reason === "disabled"
            ? "Turn on Location to confirm where you are"
            : `Allow ${PRODUCT_NAME} to use your location`,
        body: issue.branchName
          ? `Without it your clock-in is recorded without a location, and ${issue.branchName} cannot be confirmed.`
          : "Without it your clock-in is recorded without a location.",
        action: { label: "Open settings", kind: "settings", variant: "primary" },
        // Still offered, because a punch without a location is accepted
        // and flagged — refusing here would leave someone unpaid over a
        // permission dialog.
        dismissLabel: "Clock in without it",
        dismissKind: "proceed",
      };

    case "queued":
      return {
        title: "Saved — it'll sync when you're back online",
        body: `Your ${formatTime(issue.at)} clock-in is on this phone and will send itself. You can close the app.`,
        action: null,
        dismissLabel: "Got it",
        dismissKind: "close",
      };

    case "already_clocked_in":
      return {
        title: issue.since
          ? `You're already clocked in since ${formatTime(issue.since)}`
          : "You're already clocked in",
        body: "Tap Clock out when you're finished for the day.",
        action: null,
        dismissLabel: "Close",
        dismissKind: "close",
      };

    case "rejected":
      return {
        title: "That didn't save",
        body: issue.message,
        action: null,
        dismissLabel: "Close",
        dismissKind: "close",
      };
  }
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

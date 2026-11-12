import { useMemo, useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  CalendarPlus,
  ClipboardList,
  Inbox,
  PartyPopper,
  Plane,
  ReceiptText,
  TimerReset,
  Wallet,
} from "lucide-react-native";

import { ClockCard } from "@/components/clock/ClockCard";
import { ClockIssueSheet } from "@/components/clock/ClockIssueSheet";
import { StatTile } from "@/components/clock/StatTile";
import { WeekStrip } from "@/components/clock/WeekStrip";
import { FaceSittingModal } from "@/components/face/FaceSittingModal";
import { AnnouncementsCard } from "@/components/home/AnnouncementsCard";
import { FaceSetupBanner } from "@/components/home/FaceSetupBanner";
import { PoliciesBanner } from "@/components/home/PoliciesBanner";
import { QuickActions, type QuickAction } from "@/components/home/QuickActions";
import { ErrorView, LoadingView } from "@/components/state/StateViews";
import { Avatar } from "@/components/ui/Avatar";
import { IconButton } from "@/components/ui/Button";
import { HeroHeader, HeroText } from "@/components/ui/Header";
import { Section } from "@/components/ui/List";
import { Screen } from "@/components/ui/Screen";
import { errorMessage } from "@/lib/api";
import { useApprovalInbox } from "@/lib/queries/approvals";
import { mondayOf, today as todayDate, useWeek } from "@/lib/queries/attendance";
import { useMyCompany } from "@/lib/queries/company";
import { useLeaveLeft, useNextHoliday } from "@/lib/queries/home";
import { useUnreadCount } from "@/lib/queries/notifications";
import { useMyProfile } from "@/lib/queries/profile";
import { useSession } from "@/lib/queries/session";
import { useClock } from "@/lib/useClock";
import { usePunchSync } from "@/lib/usePunchSync";

/**
 * Home — the clock first, then everything else an employee comes for.
 *
 * The clock keeps its budget: it is the first card on screen, and a punch
 * is still one tap away from opening the app. Below it are the shortcuts
 * and the glanceable context — none of which is allowed to push the clock
 * down.
 *
 * The screen never decides whether a punch is valid. It measures a
 * distance so it can tell someone how far to walk, and the server does
 * the rest — an out-of-fence or location-less punch is recorded and
 * flagged, never refused.
 */
export default function HomeScreen() {
  const queryClient = useQueryClient();
  const { user, isLoading: sessionLoading, error: sessionError } = useSession();
  const profile = useMyProfile();
  const company = useMyCompany();

  const businessDate = useMemo(() => todayDate(), []);
  const monday = useMemo(() => mondayOf(businessDate), [businessDate]);

  const clock = useClock(businessDate, user?.id);
  const week = useWeek(monday);
  const leave = useLeaveLeft();
  const holiday = useNextHoliday(businessDate);
  const unread = useUnreadCount();
  const approvals = useApprovalInbox();
  const [refreshing, setRefreshing] = useState(false);

  // Flushes anything captured offline, on connectivity, on foreground,
  // and once on mount.
  usePunchSync(user?.id);

  if (sessionLoading) {
    return (
      <Screen scroll={false}>
        <LoadingView />
      </Screen>
    );
  }

  if (sessionError) {
    return (
      <Screen scroll={false}>
        <ErrorView message={errorMessage(sessionError)} />
      </Screen>
    );
  }

  const firstName = profile.data?.firstName ?? user?.firstName;
  const fullName = [profile.data?.firstName ?? user?.firstName, profile.data?.lastName ?? user?.lastName]
    .filter(Boolean)
    .join(" ");
  const waiting = approvals.data?.data.length ?? 0;

  const actions: QuickAction[] = [
    { label: "Request leave", icon: CalendarPlus, tone: "info", onPress: () => router.push("/leave/request") },
    { label: "Fix a punch", icon: TimerReset, tone: "warning", onPress: () => router.push("/attendance/correct") },
    { label: "Payslips", icon: Wallet, tone: "success", onPress: () => router.navigate("/pay") },
    { label: "Expenses", icon: ReceiptText, tone: "brand", onPress: () => router.push("/expenses") },
    { label: "My requests", icon: ClipboardList, tone: "neutral", onPress: () => router.push("/requests") },
    // Only for someone who can approve: a manager's inbox, never an
    // empty screen for everyone else.
    ...(approvals.isSuccess
      ? [{ label: "Approvals", icon: Inbox, tone: "brand" as const, count: waiting, onPress: () => router.push("/approvals") }]
      : []),
  ];

  const refresh = async () => {
    setRefreshing(true);
    await Promise.all(
      [["attendance"], ["leave"], ["holidays"], ["notifications"], ["approvals"], ["broadcasts"], ["policies"]].map((queryKey) =>
        queryClient.invalidateQueries({ queryKey }),
      ),
    );
    setRefreshing(false);
  };

  return (
    <>
      <Screen
        tabs
        refreshing={refreshing}
        onRefresh={() => void refresh()}
        hero={
          <HeroHeader>
            <View className="flex-row items-center gap-3">
              <Avatar name={fullName} tone="onBrand" size={46} />
              <View className="min-w-0 flex-1">
                <HeroText variant="small" muted>
                  {greeting()}
                </HeroText>
                <HeroText variant="h2" className="font-bold">
                  {firstName ?? "Welcome"}
                </HeroText>
              </View>
              <IconButton
                icon={Bell}
                label={unread.data ? `Notifications, ${unread.data} unread` : "Notifications"}
                tone="onBrand"
                badge={(unread.data ?? 0) > 0}
                onPress={() => router.push("/notifications")}
              />
            </View>
            {company.data?.name ? (
              <HeroText variant="caption" muted className="mt-3">
                {company.data.name}
              </HeroText>
            ) : null}
          </HeroHeader>
        }
      >
        <View className="gap-6">
          <ClockCard
            clockedIn={clock.clockedIn}
            elapsedMinutes={clock.elapsedMinutes}
            progress={clock.progress}
            openedAt={clock.openedAt}
            shift={clock.shift}
            position={clock.position}
            workLocation={clock.workLocation}
            pendingOffline={clock.pendingOffline}
            saving={clock.saving}
            warning={clock.warning}
            isPunching={clock.isPunching}
            onPunch={() => clock.punch()}
          />

          <FaceSetupBanner />

          <QuickActions actions={actions} />

          <PoliciesBanner />

          <AnnouncementsCard />

          <View className="flex-row gap-4">
            <StatTile
              label="Leave left"
              value={leave.data ? `${leave.data.days} days` : null}
              caption={leave.data?.typeName}
              icon={Plane}
              tone="info"
              onPress={() => router.navigate("/leave")}
            />
            <StatTile
              label="Next holiday"
              value={holiday.data ? formatHolidayDate(holiday.data.date) : null}
              caption={holiday.data?.name}
              icon={PartyPopper}
              tone="success"
            />
          </View>

          <Section title="This week" action="History" onAction={() => router.navigate("/attendance")}>
            <WeekStrip monday={monday} days={week.data} today={businessDate} />
          </Section>
        </View>
      </Screen>

      {/* Outside the Screen's ScrollView. A Modal renders into its own
          native window either way, but nesting it in scroll content
          invites someone to reach for absolute positioning later. */}
      <ClockIssueSheet
        issue={clock.issue}
        onDismiss={clock.dismissIssue}
        onProceed={() => {
          clock.dismissIssue();
          clock.punch({ force: true });
        }}
      />

      {/* The sitting for the punch being made, where the organisation asks
          for a face. It opens after every other question has been answered,
          and how it ends decides whether the punch is sent. */}
      <FaceSittingModal purpose="punch" visible={clock.faceSitting} onResult={clock.onFaceSitting} />
    </>
  );
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/** `12 Oct` — short enough for a tile, unambiguous about the month. */
function formatHolidayDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString([], { day: "numeric", month: "short" });
}

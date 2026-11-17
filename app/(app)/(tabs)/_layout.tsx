import { Tabs } from "expo-router";
import {
  CalendarDays,
  House,
  Timer,
  UserRound,
  Wallet,
} from "lucide-react-native";

import { FloatingTabBar } from "@/components/navigation/FloatingTabBar";
import { useApprovalInbox } from "@/lib/queries/approvals";
import { useModules } from "@/lib/queries/modules";
import { useUnreadCount } from "@/lib/queries/notifications";

/**
 * Five tabs: Home, Attendance, Leave, Pay, Me — fewer when the employer
 * doesn't have attendance, leave or payroll for this company.
 *
 * Home is a dashboard with the clock at the top — still the first thing
 * on screen and still two taps from a punch — and everything else an
 * employee does a few times a month lives under Me.
 */
export default function TabsLayout() {
  const approvals = useApprovalInbox();
  const unread = useUnreadCount();
  const somethingWaiting =
    (approvals.data?.data.length ?? 0) > 0 || (unread.data ?? 0) > 0;
  // A module the plan leaves out, or the employer switched off for this
  // company, loses its tab rather than opening onto a refusal.
  const { has } = useModules();
  const hidden = (on: boolean) => (on ? {} : { href: null });

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <House color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          title: "Attendance",
          tabBarIcon: ({ color, size }) => <Timer color={color} size={size} />,
          ...hidden(has("time_attendance")),
        }}
      />
      <Tabs.Screen
        name="leave"
        options={{
          title: "Leave",
          tabBarIcon: ({ color, size }) => (
            <CalendarDays color={color} size={size} />
          ),
          ...hidden(has("leave")),
        }}
      />
      <Tabs.Screen
        name="pay"
        options={{
          title: "Pay",
          tabBarIcon: ({ color, size }) => <Wallet color={color} size={size} />,
          ...hidden(has("payroll")),
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: "Me",
          // A dot, not a number: the Me screen says what is waiting.
          tabBarBadge: somethingWaiting ? "" : undefined,
          tabBarIcon: ({ color, size }) => (
            <UserRound color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

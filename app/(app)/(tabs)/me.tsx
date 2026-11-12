import { Children, Fragment, useCallback, useEffect, useState, type ReactNode } from "react";
import { Alert, Switch, View } from "react-native";
import Constants from "expo-constants";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Banknote,
  Bell,
  BookOpen,
  ClipboardList,
  DoorOpen,
  FileText,
  Fingerprint,
  Inbox,
  KeyRound,
  Laptop,
  LifeBuoy,
  LogOut,
  Megaphone,
  Moon,
  ReceiptText,
  ScanFace,
  ScrollText,
  ShieldAlert,
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react-native";

import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { HeroHeader, HeroText } from "@/components/ui/Header";
import { Divider, ListCard, ListRow, Section } from "@/components/ui/List";
import { Screen } from "@/components/ui/Screen";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Sheet } from "@/components/ui/Sheet";
import { Text } from "@/components/ui/Text";
import { getCapability, isEnabled, promptOnce, setEnabled } from "@/lib/biometrics";
import { useApprovalInbox } from "@/lib/queries/approvals";
import { useMyCompany } from "@/lib/queries/company";
import { useModules } from "@/lib/queries/modules";
import { useMyTeam } from "@/lib/queries/people";
import { useOutstandingPolicies } from "@/lib/queries/workplace";
import { useUnreadCount } from "@/lib/queries/notifications";
import { useMyProfile } from "@/lib/queries/profile";
import { signOut } from "@/lib/session";
import { useTheme, useThemeColors, type Preference } from "@/lib/theme/ThemeProvider";
import { useAuthStore } from "@/store/useAuthStore";
import type { FaceState } from "@/lib/face";
import { useFaceStatus } from "@/lib/queries/face";

/** What the Face check row says under its title. */
const FACE_SUBTITLE: Record<FaceState, string> = {
  unavailable: "Not in use",
  off: "Not asked of you",
  needs_consent: "Needs your agreement",
  needs_enrolment: "Not set up yet",
  awaiting_review: "Waiting for HR",
  ready: "Set up",
};

/**
 * Me — who I am, what I've asked for, and the settings.
 *
 * Everything an employee does a few times a month lives here. Sign-out
 * is deliberately unmissable: some employees share a shift device, and a
 * phone left signed in as the last person is how one person's payslip is
 * read by the next.
 */
export default function MeScreen() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const profile = useMyProfile();
  const company = useMyCompany();
  const unread = useUnreadCount();
  const approvals = useApprovalInbox();
  const { has } = useModules();
  const face = useFaceStatus();
  const team = useMyTeam();
  const policies = useOutstandingPolicies(has("employee_relations"));
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const { preference } = useTheme();

  const waiting = approvals.data?.data.length ?? 0;
  const toAccept = policies.data?.length ?? 0;
  const relations = has("employee_relations");
  const work = has("performance") || has("learning") || Boolean(team.data?.length);

  // The profile is the better source — it is the employee record, and it
  // is present on a cold start where the token's name is not.
  const displayName =
    [profile.data?.firstName, profile.data?.lastName].filter(Boolean).join(" ") ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ");
  const posting = [profile.data?.designationName, profile.data?.departmentName].filter(Boolean).join(" · ");

  const confirmSignOut = () =>
    Alert.alert("Sign out?", "Anything waiting to sync is sent first.", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: () => void signOut(queryClient) },
    ]);

  return (
    <>
      <Screen
        tabs
        hero={
          <HeroHeader>
            <View className="items-center gap-2 pb-2">
              <Avatar name={displayName || user?.email} tone="onBrand" size={76} />
              <HeroText variant="h2" className="text-center font-bold">
                {displayName || user?.email || "Me"}
              </HeroText>
              {posting ? (
                <HeroText variant="small" muted className="text-center">
                  {posting}
                </HeroText>
              ) : null}
            </View>
          </HeroHeader>
        }
      >
        <View className="gap-6">
          <Card className="flex-row items-center justify-around py-3">
            <Meta label="Employee no." value={profile.data?.employeeNumber} />
            <View className="h-8 w-hairline bg-border" />
            <Meta label="Branch" value={profile.data?.branchName} />
          </Card>

          <Section title="Requests">
            <Rows>
              <ListRow icon={ClipboardList} iconTone="neutral" title="My requests" subtitle="Everything you've asked for, and where it is" onPress={() => router.push("/requests")} />
              {/*
                Shown only when something is actually waiting. An approvals
                row that is always empty for most employees teaches everyone
                to ignore this list — and the inbox is server-resolved, so
                its emptiness is authoritative rather than a guess about
                someone's role.
              */}
              {waiting > 0 ? (
                <ListRow icon={Inbox} title="Approvals" subtitle="Waiting for your decision" count={waiting} onPress={() => router.push("/approvals")} />
              ) : null}
              {has("expenses") ? <ListRow icon={ReceiptText} iconTone="info" title="Expenses" onPress={() => router.push("/expenses")} /> : null}
              {has("payroll") ? (
                <ListRow icon={Banknote} iconTone="success" title="Loans" subtitle="Salary advances and staff loans" onPress={() => router.push("/loans")} />
              ) : null}
              <ListRow icon={Bell} iconTone="warning" title="Notifications" count={unread.data ?? 0} onPress={() => router.push("/notifications")} />
            </Rows>
          </Section>

          {work ? (
            <Section title="Work">
              <Rows>
                {has("performance") ? (
                  <ListRow icon={TrendingUp} iconTone="success" title="Performance" subtitle="Goals, reviews and appraisals" onPress={() => router.push("/performance")} />
                ) : null}
                {has("learning") ? (
                  <ListRow icon={BookOpen} iconTone="info" title="My learning" subtitle="Courses and certifications" onPress={() => router.push("/learning")} />
                ) : null}
                {/* Like approvals: only for someone with direct reports. */}
                {team.data?.length ? (
                  <ListRow
                    icon={Users}
                    iconTone="brand"
                    title="My team"
                    subtitle={`${team.data.length} ${team.data.length === 1 ? "person reports" : "people report"} to you`}
                    onPress={() => router.push("/team")}
                  />
                ) : null}
              </Rows>
            </Section>
          ) : null}

          <Section title="My record">
            <Rows>
              <ListRow icon={UserRound} title="Profile" subtitle="Contact, next of kin, bank" onPress={() => router.push("/profile")} />
              {has("documents") ? <ListRow icon={FileText} iconTone="info" title="Documents" onPress={() => router.push("/documents")} /> : null}
              {has("assets") ? (
                <ListRow icon={Laptop} iconTone="neutral" title="My assets" subtitle="Equipment you have, and requests" onPress={() => router.push("/assets")} />
              ) : null}
              {has("broadcast") ? <ListRow icon={Megaphone} iconTone="brand" title="Announcements" onPress={() => router.push("/announcements")} /> : null}
              <ListRow icon={DoorOpen} iconTone="neutral" title="Resignation" onPress={() => router.push("/resignation")} />
            </Rows>
          </Section>

          {relations ? (
            <Section title="Workplace">
              <Rows>
                <ListRow
                  icon={ScrollText}
                  iconTone="warning"
                  title="Policies"
                  subtitle={toAccept > 0 ? "Waiting for you to read and accept" : "Nothing to accept"}
                  count={toAccept}
                  onPress={() => router.push("/policies")}
                />
                <ListRow icon={LifeBuoy} iconTone="neutral" title="Cases about me" onPress={() => router.push("/cases")} />
                <ListRow icon={ShieldAlert} iconTone="danger" title="Speak up" subtitle="Report wrongdoing in confidence" onPress={() => router.push("/speak-up")} />
              </Rows>
            </Section>
          ) : null}

          <Section title="Settings">
            <ListCard>
              <ListRow
                icon={Moon}
                iconTone="neutral"
                title="Appearance"
                right={<Badge>{{ system: "System", light: "Light", dark: "Dark" }[preference]}</Badge>}
                onPress={() => setAppearanceOpen(true)}
              />
              <Divider inset={68} />
              <ListRow
                icon={Bell}
                iconTone="neutral"
                title="Notifications"
                subtitle="What reaches this phone"
                onPress={() => router.push("/notification-settings")}
              />
              <BiometricRow />
              <Divider inset={68} />
              {face.data && (face.data.required || face.data.consentGiven) ? (
                <>
                  <ListRow
                    icon={ScanFace}
                    iconTone="neutral"
                    title="Face check"
                    subtitle={FACE_SUBTITLE[face.data.state]}
                    onPress={() => router.push("/face")}
                  />
                  <Divider inset={68} />
                </>
              ) : null}
              <ListRow icon={KeyRound} iconTone="neutral" title="Security" subtitle="Two-factor authentication" onPress={() => router.push("/security")} />
              <Divider inset={68} />
              <ListRow icon={LogOut} title="Sign out" destructive chevron={false} onPress={confirmSignOut} />
            </ListCard>
          </Section>

          <Text variant="caption" className="text-center text-text-disabled">
            {[company.data?.name, versionLabel()].filter(Boolean).join(" · ")}
          </Text>
        </View>
      </Screen>

      <AppearanceSheet visible={appearanceOpen} onClose={() => setAppearanceOpen(false)} />
    </>
  );
}

/** A card of rows with a divider between each, skipping the ones a condition left out. */
function Rows({ children }: { children: ReactNode }) {
  // toArray drops the nulls, and keys each row.
  const rows = Children.toArray(children);
  return (
    <ListCard>
      {rows.map((row, i) => (
        <Fragment key={i}>
          {i > 0 ? <Divider inset={68} /> : null}
          {row}
        </Fragment>
      ))}
    </ListCard>
  );
}

function Meta({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <View className="flex-1 items-center gap-0.5 px-2">
      <Text variant="caption" className="text-text-secondary">
        {label}
      </Text>
      <Text variant="small" tabular numberOfLines={1} className="font-semibold text-text-primary">
        {value || "—"}
      </Text>
    </View>
  );
}

function AppearanceSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { preference, setPreference } = useTheme();
  return (
    <Sheet visible={visible} onClose={onClose} title="Appearance" subtitle="System follows your phone's setting.">
      <SegmentedControl<Preference>
        value={preference}
        onChange={(value) => {
          setPreference(value);
          onClose();
        }}
        options={[
          { value: "system", label: "System" },
          { value: "light", label: "Light" },
          { value: "dark", label: "Dark" },
        ]}
      />
    </Sheet>
  );
}

/**
 * The unlock preference.
 *
 * Renders nothing at all when the device has no enrolled biometric — a
 * toggle that cannot be switched on is a question the employee cannot
 * answer, and the honest response is not to ask.
 *
 * Turning it ON prompts immediately. Storing a preference the person
 * then cannot satisfy would lock them behind a check they never passed,
 * so the prompt is the confirmation.
 */
function BiometricRow() {
  const colors = useThemeColors();
  const [label, setLabel] = useState<string | null>(null);
  const [enabled, setEnabledState] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const capability = await getCapability();
      if (cancelled || !capability.available) return;

      const current = await isEnabled();
      if (cancelled) return;

      setLabel(capability.label);
      setEnabledState(current);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = useCallback((next: boolean) => {
    void (async () => {
      if (next) {
        // Fails closed: turning the setting on without passing the check
        // would store a preference the person cannot satisfy.
        const passed = await promptOnce("Confirm to turn on unlock", { failOpen: false });
        if (!passed) return;
      }
      await setEnabled(next);
      setEnabledState(next);
    })();
  }, []);

  if (!label) return null;

  return (
    <>
      <Divider inset={68} />
      <ListRow
        icon={Fingerprint}
        iconTone="success"
        title={label}
        chevron={false}
        right={
          <Switch
            value={enabled}
            onValueChange={toggle}
            accessibilityLabel={label}
            trackColor={{ true: colors.brand, false: colors.borderStrong }}
            thumbColor="#FFFFFF"
          />
        }
      />
    </>
  );
}

/** `v1.0.0 (42)` — the store build, which is what support asks for. */
function versionLabel(): string {
  const version = Constants.expoConfig?.version ?? "1.0.0";
  const build = Constants.expoConfig?.ios?.buildNumber ?? Constants.expoConfig?.android?.versionCode ?? null;
  return build ? `v${version} (${build})` : `v${version}`;
}

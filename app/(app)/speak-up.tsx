import { useState } from "react";
import { Pressable, Share, View } from "react-native";
import { Check, ShieldAlert } from "lucide-react-native";

import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Field";
import { ScreenHeader } from "@/components/ui/Header";
import { Section } from "@/components/ui/List";
import { Screen } from "@/components/ui/Screen";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Text } from "@/components/ui/Text";
import { toast } from "@/components/ui/Toast";
import { errorMessage } from "@/lib/api";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import {
  useOpenReport,
  useReplyToReport,
  useSubmitReport,
  type Report,
  type ReportCategory,
} from "@/lib/queries/workplace";
import { useThemeColors } from "@/lib/theme/ThemeProvider";

const CATEGORIES: { value: ReportCategory; label: string }[] = [
  { value: "fraud", label: "Fraud" },
  { value: "harassment", label: "Harassment" },
  { value: "discrimination", label: "Discrimination" },
  { value: "safety", label: "Health and safety" },
  { value: "corruption", label: "Bribery or corruption" },
  { value: "data_misuse", label: "Misuse of data" },
  { value: "other", label: "Something else" },
];

/** The server's minimum, so the button says why it is off rather than a 400 saying it later. */
const MIN_BODY = 20;

/**
 * Speak up. An anonymous report stores nothing that identifies the
 * reporter, so the reference and access code shown once after sending
 * are the only way back to it. Nothing here is cached: a report thread
 * lives in this screen's state and is gone when the screen is.
 */
export default function SpeakUpScreen() {
  const [tab, setTab] = useState<"report" | "follow">("report");

  return (
    <Screen header={<ScreenHeader title="Speak up" subtitle="Report wrongdoing in confidence" />}>
      <View className="gap-6 pt-2">
        <SegmentedControl
          value={tab}
          onChange={setTab}
          options={[
            { value: "report", label: "Make a report" },
            { value: "follow", label: "Follow one up" },
          ]}
        />
        {tab === "report" ? <ReportForm /> : <FollowUp />}
      </View>
    </Screen>
  );
}

function ReportForm() {
  const colors = useThemeColors();
  const submit = useSubmitReport();
  const [category, setCategory] = useState<ReportCategory>("other");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [anonymous, setAnonymous] = useState(true);
  const [receipt, setReceipt] = useState<{ reference: string; accessCode: string; anonymous: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (receipt) {
    const text = `Reference: ${receipt.reference}\nAccess code: ${receipt.accessCode}`;
    return (
      <Card className="gap-4">
        <Text variant="h3" className="text-text-primary">
          Report received
        </Text>
        <Text variant="small" className="text-text-body">
          Save these now. They are shown only once, and they are the only way to follow up or read replies
          {receipt.anonymous ? " — nothing links an anonymous report to you" : ""}.
        </Text>
        <View className="gap-1 rounded-xl bg-bg-inset p-4">
          <Text variant="body" selectable tabular className="text-text-primary">
            Reference: {receipt.reference}
          </Text>
          <Text variant="body" selectable tabular className="text-text-primary">
            Access code: {receipt.accessCode}
          </Text>
        </View>
        <View className="flex-row gap-3">
          <Button label="Save or share" variant="secondary" className="flex-1" onPress={() => void Share.share({ message: text })} />
          <Button label="I've saved them" className="flex-1" onPress={() => setReceipt(null)} />
        </View>
      </Card>
    );
  }

  const bodyShort = body.trim().length > 0 && body.trim().length < MIN_BODY;

  return (
    <View className="gap-4">
      <Field label="What is it about?" required>
        <Select title="What is it about?" value={category} onChange={setCategory} options={CATEGORIES} />
      </Field>
      <Field label="Subject" required>
        <Input value={subject} onChangeText={setSubject} maxLength={200} />
      </Field>
      <Field
        label="What happened?"
        required
        hint="When, where, who was involved, and anything that supports it."
        error={bodyShort ? "A little more detail, please." : error}
      >
        <Input value={body} onChangeText={setBody} multiline maxLength={20_000} />
      </Field>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: anonymous }}
        onPress={() => setAnonymous((value) => !value)}
        className="flex-row items-start gap-3"
      >
        <View
          className={cn(
            "mt-0.5 h-6 w-6 items-center justify-center rounded-md border-2",
            anonymous ? "border-brand bg-brand" : "border-border-strong",
          )}
        >
          {anonymous ? <Check size={14} color={colors.onBrand} strokeWidth={3} /> : null}
        </View>
        <View className="flex-1">
          <Text variant="body" className="text-text-primary">
            Report anonymously
          </Text>
          <Text variant="small" className="text-text-secondary">
            Your name is not stored with the report. Untick it to let investigators contact you directly.
          </Text>
        </View>
      </Pressable>
      <Button
        label="Send report"
        icon={ShieldAlert}
        size="lg"
        block
        haptic
        disabled={!subject.trim() || body.trim().length < MIN_BODY}
        loading={submit.isPending}
        onPress={() => {
          setError(null);
          submit.mutate(
            { category, subject: subject.trim(), body: body.trim(), anonymous },
            {
              onSuccess: (result) => {
                setReceipt({ ...result, anonymous });
                setSubject("");
                setBody("");
                setCategory("other");
              },
              onError: (e) => setError(errorMessage(e)),
            },
          );
        }}
      />
    </View>
  );
}

function FollowUp() {
  const open = useOpenReport();
  const send = useReplyToReport();
  const [reference, setReference] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [thread, setThread] = useState<Report | null>(null);
  const [reply, setReply] = useState("");

  if (!thread) {
    return (
      <View className="gap-4">
        <Field label="Reference">
          <Input value={reference} onChangeText={setReference} autoCapitalize="characters" autoCorrect={false} />
        </Field>
        <Field label="Access code" error={open.isError ? errorMessage(open.error) : null}>
          <Input value={accessCode} onChangeText={setAccessCode} autoCapitalize="none" autoCorrect={false} secureTextEntry />
        </Field>
        <Button
          label="Open report"
          variant="secondary"
          size="lg"
          block
          disabled={!reference.trim() || !accessCode.trim()}
          loading={open.isPending}
          onPress={() =>
            open.mutate({ reference: reference.trim(), accessCode: accessCode.trim() }, { onSuccess: setThread })
          }
        />
      </View>
    );
  }

  return (
    <View className="gap-4">
      <Card className="gap-2">
        <View className="flex-row items-start justify-between gap-3">
          <Text variant="body" className="flex-1 font-semibold text-text-primary">
            {thread.subject}
          </Text>
          <StatusBadge status={thread.status} />
        </View>
        <Text variant="small" className="text-text-body">
          {thread.body}
        </Text>
      </Card>

      {thread.messages.length > 0 ? (
        <Section title="Messages">
          {thread.messages.map((message, i) => (
            <View
              key={i}
              className={cn("gap-1 rounded-2xl p-3", message.fromReporter ? "bg-bg-inset" : "bg-brand-subtle")}
            >
              <Text variant="caption" className="font-semibold text-text-secondary">
                {message.fromReporter ? "You" : "Investigator"}
                {message.createdAt ? ` · ${formatDate(message.createdAt)}` : ""}
              </Text>
              <Text variant="small" className="text-text-primary">
                {message.body}
              </Text>
            </View>
          ))}
        </Section>
      ) : null}

      {thread.outcome ? (
        <Text variant="small" className="rounded-xl bg-success-subtle px-3 py-2.5 text-success-ink">
          Outcome: {thread.outcome}
        </Text>
      ) : null}

      {thread.status !== "closed" ? (
        <Field label="Reply" hint="Add information, or answer a question." error={send.isError ? errorMessage(send.error) : null}>
          <Input value={reply} onChangeText={setReply} multiline maxLength={20_000} />
        </Field>
      ) : null}
      {thread.status !== "closed" ? (
        <Button
          label="Send"
          disabled={!reply.trim()}
          loading={send.isPending}
          onPress={() =>
            send.mutate(
              { reference: reference.trim(), accessCode: accessCode.trim(), body: reply.trim() },
              {
                onSuccess: (next) => {
                  setThread(next);
                  setReply("");
                  toast.success("Reply sent");
                },
              },
            )
          }
        />
      ) : null}
      <Button
        label="Close the report"
        variant="ghost"
        onPress={() => {
          // Forget the code as well as the thread: the next person to pick up this phone shouldn't be able to reopen it.
          setThread(null);
          setAccessCode("");
          setReply("");
        }}
      />
    </View>
  );
}

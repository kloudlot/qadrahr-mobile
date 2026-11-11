import { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";

import { ErrorView } from "@/components/state/StateViews";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Field";
import { ScreenHeader } from "@/components/ui/Header";
import { Section } from "@/components/ui/List";
import { Screen } from "@/components/ui/Screen";
import { SkeletonList } from "@/components/ui/Skeleton";
import { Text } from "@/components/ui/Text";
import { toast } from "@/components/ui/Toast";
import { errorMessage } from "@/lib/api";
import {
  useBanks,
  useMyProfile,
  useRequestProfileChange,
  type MyProfile,
  type ProfileChanges,
} from "@/lib/queries/profile";

const MARITAL = ["single", "married", "divorced", "widowed", "undisclosed"] as const;
type Marital = (typeof MARITAL)[number];

/**
 * Ask for my details to change. Only what differs is sent, and it goes to
 * approval — the record itself is updated when it is approved.
 */
export default function EditProfileScreen() {
  const profile = useMyProfile();

  return (
    <Screen header={<ScreenHeader title="Request a change" subtitle="HR approves it before it's saved" />}>
      {profile.isLoading ? (
        <SkeletonList rows={5} />
      ) : profile.error || !profile.data ? (
        <ErrorView message={errorMessage(profile.error)} onRetry={() => void profile.refetch()} />
      ) : (
        <Form profile={profile.data} />
      )}
    </Screen>
  );
}

function Form({ profile }: { profile: MyProfile }) {
  const banks = useBanks();
  const submit = useRequestProfileChange();

  const [phone, setPhone] = useState(profile.phone ?? "");
  const [alternatePhone, setAlternatePhone] = useState(profile.alternatePhone ?? "");
  const [personalEmail, setPersonalEmail] = useState(profile.personalEmail ?? "");
  const [address, setAddress] = useState(profile.residentialAddress ?? "");
  const [marital, setMarital] = useState<Marital | null>((profile.maritalStatus as Marital | undefined) ?? null);
  const [kinName, setKinName] = useState(profile.nextOfKin?.name ?? "");
  const [kinRelationship, setKinRelationship] = useState(profile.nextOfKin?.relationship ?? "");
  const [kinPhone, setKinPhone] = useState(profile.nextOfKin?.phone ?? "");
  const [bankId, setBankId] = useState<string | null>(profile.bank?.bankListId ?? null);
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState(profile.bank?.accountName ?? "");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const changes = (): ProfileChanges | string => {
    const out: ProfileChanges = {};
    const differs = (next: string, current: string | undefined | null) => next.trim() !== (current ?? "").trim();

    if (differs(phone, profile.phone)) out.phone = phone.trim();
    if (differs(alternatePhone, profile.alternatePhone)) out.alternatePhone = alternatePhone.trim();
    if (differs(personalEmail, profile.personalEmail)) out.personalEmail = personalEmail.trim();
    if (differs(address, profile.residentialAddress)) out.residentialAddress = address.trim();
    if (marital && marital !== profile.maritalStatus) out.maritalStatus = marital;

    const kinTouched =
      differs(kinName, profile.nextOfKin?.name) ||
      differs(kinRelationship, profile.nextOfKin?.relationship) ||
      differs(kinPhone, profile.nextOfKin?.phone);
    if (kinTouched) {
      if (!kinName.trim() || !kinRelationship.trim() || !kinPhone.trim()) {
        return "Next of kin needs a name, a relationship and a phone number.";
      }
      out.nextOfKin = { name: kinName.trim(), relationship: kinRelationship.trim(), phone: kinPhone.trim() };
    }

    // A bank change is all-or-nothing, and only when a new number is typed:
    // the current one is never shown in full, so it cannot be "kept".
    if (accountNumber.trim()) {
      if (!bankId || !accountName.trim()) return "A bank change needs the bank, the account number and the account name.";
      // Digits only; the length rule depends on the country, and the server checks it.
      if (!/^\d+$/.test(accountNumber.trim())) return "An account number is digits only.";
      out.bank = { bankListId: bankId, accountNumber: accountNumber.trim(), accountName: accountName.trim() };
    }
    return out;
  };

  const send = () => {
    const result = changes();
    if (typeof result === "string") return setError(result);
    if (Object.keys(result).length === 0) return setError("Nothing has changed yet.");
    setError(null);
    submit.mutate(
      { ...result, ...(reason.trim() ? { reason: reason.trim() } : {}) },
      {
        onSuccess: () => {
          toast.success("Change requested", "HR will review it before it's saved.");
          router.back();
        },
        onError: (e) => setError(errorMessage(e)),
      },
    );
  };

  return (
    <View className="gap-6 pb-4 pt-2">
      <Section title="Contact">
        <Card className="gap-4">
          <Field label="Phone">
            <Input value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" />
          </Field>
          <Field label="Other phone">
            <Input value={alternatePhone} onChangeText={setAlternatePhone} keyboardType="phone-pad" />
          </Field>
          <Field label="Personal email">
            <Input value={personalEmail} onChangeText={setPersonalEmail} keyboardType="email-address" autoCapitalize="none" />
          </Field>
          <Field label="Home address">
            <Input value={address} onChangeText={setAddress} multiline />
          </Field>
          <Field label="Marital status">
            <Select
              title="Marital status"
              value={marital}
              onChange={setMarital}
              options={MARITAL.map((m) => ({ value: m, label: m.charAt(0).toUpperCase() + m.slice(1) }))}
            />
          </Field>
        </Card>
      </Section>

      <Section title="Next of kin">
        <Card className="gap-4">
          <Field label="Name">
            <Input value={kinName} onChangeText={setKinName} />
          </Field>
          <Field label="Relationship">
            <Input value={kinRelationship} onChangeText={setKinRelationship} placeholder="e.g. Sister" />
          </Field>
          <Field label="Phone">
            <Input value={kinPhone} onChangeText={setKinPhone} keyboardType="phone-pad" />
          </Field>
        </Card>
      </Section>

      <Section title="Bank">
        {banks.isSuccess ? (
          <Card className="gap-4">
            <Field label="Bank">
              <Select
                title="Bank"
                value={bankId}
                onChange={setBankId}
                options={banks.data.map((b) => ({ value: b.bankListId, label: b.name }))}
              />
            </Field>
            <Field label="New account number" hint="Leave empty to keep your current account.">
              <Input value={accountNumber} onChangeText={setAccountNumber} keyboardType="number-pad" maxLength={20} />
            </Field>
            <Field label="Account name">
              <Input value={accountName} onChangeText={setAccountName} />
            </Field>
          </Card>
        ) : (
          <Card>
            <Text variant="small" className="text-text-secondary">
              Bank changes go through HR directly for your company.
            </Text>
          </Card>
        )}
      </Section>

      <Field label="Reason" hint="Optional. HR sees it." error={error}>
        <Input value={reason} onChangeText={setReason} multiline placeholder="e.g. New phone number" />
      </Field>

      <Button label="Send for approval" size="lg" block haptic loading={submit.isPending} onPress={send} />
    </View>
  );
}

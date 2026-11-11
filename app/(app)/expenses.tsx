import { useState } from "react";
import { amountPlaceholder, decimalsFor } from "@/lib/money";
import { Image, Pressable, View } from "react-native";
import {
  Camera,
  ChevronDown,
  ChevronUp,
  ImageIcon,
  Plus,
  ReceiptText,
  Trash2,
  X,
} from "lucide-react-native";

import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Field";
import { DateField } from "@/components/ui/Pickers";
import { ScreenHeader } from "@/components/ui/Header";
import { Screen } from "@/components/ui/Screen";
import { SkeletonList } from "@/components/ui/Skeleton";
import { Text } from "@/components/ui/Text";
import { toast } from "@/components/ui/Toast";
import { EmptyView, ErrorView } from "@/components/state/StateViews";
import { cn } from "@/lib/cn";
import { formatDate, isoDate } from "@/lib/format";
import { useThemeColors } from "@/lib/theme/ThemeProvider";
import { errorMessage } from "@/lib/api";
import { formatMoney } from "@/lib/queries/company";
import {
  captureFromCamera,
  pickFromLibrary,
  uploadReceipt,
  type CapturedReceipt,
} from "@/lib/receipts";
import {
  parseAmount,
  useAddLine,
  useExpenseCategories,
  useMyClaims,
  useOpenClaim,
  useRemoveLine,
  useSubmitClaim,
  type ExpenseCategory,
  type ExpenseClaim,
} from "@/lib/queries/expenses";

/**
 * Expenses — screen 07.
 *
 * A claim is assembled over days rather than filled in one sitting: the
 * API opens one empty, takes lines one at a time, and submits
 * separately, because someone on a trip photographs receipts as they go.
 * This screen mirrors that instead of pretending it is a single form.
 *
 * Receipt capture is camera-first, as the design draws it. The photo
 * goes DIRECTLY to object storage through a presigned slot and only the
 * key reaches the API — see lib/receipts.ts.
 */
export default function ExpensesScreen() {
  const claims = useMyClaims();
  const openClaim = useOpenClaim();

  const [title, setTitle] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const rows = claims.data?.data ?? [];

  return (
    <Screen
      header={
        <ScreenHeader
          title="Expenses"
          subtitle="Claims are built up as you go"
        />
      }
      refreshing={claims.isRefetching}
      onRefresh={() => void claims.refetch()}
    >
      <View className="gap-4 pt-2">
        <Card className="gap-3">
          <Field label="Start a claim">
            <Input
              accessibilityLabel="What is this claim for"
              value={title}
              onChangeText={setTitle}
              placeholder="Lagos client visit"
            />
          </Field>
          <Button
            label="Open claim"
            block
            loading={openClaim.isPending}
            disabled={title.trim().length === 0 || openClaim.isPending}
            onPress={() =>
              openClaim.mutate(title.trim(), {
                onSuccess: (claim) => {
                  setTitle("");
                  // Straight into the one just opened — it is empty, and
                  // the next thing anyone does is add a line.
                  setExpandedId(claim._id);
                },
              })
            }
          />
          {openClaim.isError ? (
            <Text variant="small" className="text-danger-ink">
              {errorMessage(openClaim.error)}
            </Text>
          ) : null}
        </Card>

        {claims.isLoading ? (
          <SkeletonList rows={3} />
        ) : claims.error ? (
          <ErrorView
            message={errorMessage(claims.error)}
            onRetry={() => void claims.refetch()}
          />
        ) : rows.length === 0 ? (
          <EmptyView
            icon={ReceiptText}
            title="No claims yet"
            detail="Open one above and add what you spent, line by line."
          />
        ) : (
          <View className="gap-3">
            {rows.map((claim) => (
              <ClaimCard
                key={claim._id}
                claim={claim}
                expanded={expandedId === claim._id}
                onToggle={() =>
                  setExpandedId((current) =>
                    current === claim._id ? null : claim._id,
                  )
                }
              />
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}

function ClaimCard({
  claim,
  expanded,
  onToggle,
}: {
  claim: ExpenseClaim;
  expanded: boolean;
  onToggle: () => void;
}) {
  const colors = useThemeColors();
  const addLine = useAddLine();
  const submit = useSubmitClaim();
  const removeLine = useRemoveLine();
  const categories = useExpenseCategories();

  const [description, setDescription] = useState("");
  const [merchant, setMerchant] = useState("");
  // Today by default — receipts are usually photographed as they're collected — but a
  // claim built up over a trip needs earlier days too.
  const [spentOn, setSpentOn] = useState(() => isoDate(new Date()));
  const [amount, setAmount] = useState("");
  const [categoryCode, setCategoryCode] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<CapturedReceipt | null>(null);
  const [uploading, setUploading] = useState(false);
  const [receiptError, setReceiptError] = useState<string | null>(null);

  const editable = claim.status === "draft" || claim.status === "queried";
  const parsed = parseAmount(amount, claim.currency);

  const available = categories.data ?? [];
  // Every line needs a category from the company's expense policy. With no
  // policy (or one with no categories) there is nothing to choose, so the
  // form is replaced by a message rather than sending a blank category.
  const noCategories = categories.isSuccess && available.length === 0;
  const category = available.find((row) => row.code === categoryCode) ?? null;
  const overCap =
    category?.capMinorUnits != null &&
    parsed !== null &&
    parsed > category.capMinorUnits;

  // The server refuses a line above this without one, so the requirement
  // is shown before the attempt rather than as a 400 afterwards.
  const threshold = category?.receiptRequiredAboveMinorUnits;
  const receiptRequired =
    threshold !== null &&
    threshold !== undefined &&
    parsed !== null &&
    parsed > threshold;

  const capture = (source: "camera" | "library") => {
    setReceiptError(null);
    void (async () => {
      const captured =
        source === "camera"
          ? await captureFromCamera()
          : await pickFromLibrary();
      // Null is a cancelled picker or a declined permission. Neither is
      // an error worth a red message — the employee chose.
      if (captured) setReceipt(captured);
    })();
  };

  const addLineWithReceipt = () => {
    if (!parsed || !category) return;
    setReceiptError(null);

    void (async () => {
      let receiptKey: string | undefined;

      if (receipt) {
        setUploading(true);
        try {
          // Uploaded BEFORE the line is created. A line citing a key
          // whose object never arrived shows the approver a broken link
          // at the moment they are deciding whether to pay.
          receiptKey = await uploadReceipt(receipt);
        } catch (error) {
          setReceiptError(
            error instanceof Error
              ? error.message
              : "The receipt did not upload.",
          );
          setUploading(false);
          return;
        }
        setUploading(false);
      }

      addLine.mutate(
        {
          claimId: claim._id,
          categoryCode: category.code,
          description: description.trim(),
          spentOn,
          amountMinorUnits: parsed,
          merchant: merchant.trim() || undefined,
          receiptKey,
        },
        {
          onSuccess: () => {
            setDescription("");
            setAmount("");
            setMerchant("");
            setReceipt(null);
            // The category and date are kept: a trip's lines are usually
            // the same kind of spend, on the same day.
          },
        },
      );
    })();
  };

  return (
    <Card className="gap-3">
      <Pressable accessibilityRole="button" onPress={onToggle}>
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1 gap-0.5">
            <Text variant="body" className="font-semibold text-text-primary">
              {claim.title}
            </Text>
            <Text variant="caption" className="text-text-secondary">
              {claim.reference} · {claim.lines.length}{" "}
              {claim.lines.length === 1 ? "line" : "lines"}
            </Text>
          </View>

          <View className="items-end gap-1">
            <Text
              variant="body"
              tabular
              className="font-semibold text-text-primary"
            >
              {formatMoney(claim.totalMinorUnits, claim.currency)}
            </Text>
            <StatusBadge status={claim.status} />
          </View>
          {expanded ? (
            <ChevronUp size={18} color={colors.textSecondary} />
          ) : (
            <ChevronDown size={18} color={colors.textSecondary} />
          )}
        </View>
      </Pressable>

      {expanded ? (
        <View className="gap-3">
          {/* Why it came back, or that it's been paid — the two things a claimant opens it to find out. */}
          {claim.note ? (
            <Text
              variant="small"
              className="rounded-xl bg-warning-subtle px-3 py-2.5 text-warning-ink"
            >
              From your approver: {claim.note}
            </Text>
          ) : null}
          {claim.reimbursedAt ? (
            <Text
              variant="small"
              className="rounded-xl bg-success-subtle px-3 py-2.5 text-success-ink"
            >
              Reimbursed {formatDate(claim.reimbursedAt)}
              {claim.reimbursementReference
                ? ` · reference ${claim.reimbursementReference}`
                : ""}
            </Text>
          ) : null}

          {claim.lines.map((line) => (
            <View
              key={line._id}
              className="gap-0.5 border-t border-border pt-2"
            >
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1">
                  <Text variant="small" className="text-text-primary">
                    {line.description}
                  </Text>
                  <Text variant="caption" className="text-text-secondary">
                    {[
                      formatDate(line.spentOn),
                      available.find((row) => row.code === line.categoryCode)
                        ?.name ?? line.categoryCode,
                      line.merchant,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </Text>
                </View>
                <Text variant="small" tabular className="text-text-primary">
                  {formatMoney(line.amountMinorUnits, claim.currency)}
                </Text>
                {editable ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${line.description}`}
                    hitSlop={10}
                    disabled={removeLine.isPending}
                    onPress={() =>
                      removeLine.mutate(
                        { claimId: claim._id, lineId: line._id },
                        {
                          onError: (error) =>
                            toast.error(
                              "Couldn't remove it",
                              errorMessage(error),
                            ),
                        },
                      )
                    }
                    className="active:opacity-60"
                  >
                    <Trash2 size={16} color={colors.danger} />
                  </Pressable>
                ) : null}
              </View>

              {/* Flags, never refusals. An employee who genuinely
                  overspent must still be able to claim it — the approver
                  decides, and hiding the flag would hide the overspend. */}
              {line.overCap ? (
                <Text variant="caption" className="text-warning-ink">
                  Over the policy cap — needs sign-off
                </Text>
              ) : null}
              {line.possibleDuplicateOf ? (
                <Text variant="caption" className="text-warning-ink">
                  Looks like a line already claimed on{" "}
                  {line.possibleDuplicateOf}
                </Text>
              ) : null}
              {line.hasReceipt ? (
                <Text variant="caption" className="text-success-ink">
                  Receipt attached
                </Text>
              ) : null}
            </View>
          ))}

          {editable ? (
            <View className="gap-3 border-t border-border pt-3">
              {categories.isError ? (
                <EmptyView
                  compact
                  title="Couldn't load expense categories"
                  detail={errorMessage(categories.error)}
                  action={{
                    label: "Try again",
                    onPress: () => void categories.refetch(),
                  }}
                />
              ) : noCategories ? (
                <EmptyView
                  compact
                  icon={ReceiptText}
                  title="No expense categories yet"
                  detail="No expense categories are set up for your company yet. Ask HR or finance to create an expense policy."
                />
              ) : (
                <>
                  <Text
                    variant="small"
                    className="font-semibold text-text-label"
                  >
                    Add a line
                  </Text>
                  <Input
                    accessibilityLabel="What was it"
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Taxi, airport to office"
                  />
                  <Input
                    accessibilityLabel={`Amount in ${claim.currency}`}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType={
                      decimalsFor(claim.currency) ? "decimal-pad" : "number-pad"
                    }
                    placeholder={`${amountPlaceholder(claim.currency)} ${claim.currency}`}
                    style={{ fontVariant: ["tabular-nums"] }}
                  />
                  <Input
                    accessibilityLabel="Where"
                    value={merchant}
                    onChangeText={setMerchant}
                    placeholder="Where (optional)"
                  />
                  <DateField
                    value={spentOn}
                    onChange={setSpentOn}
                    max={isoDate(new Date())}
                    title="When was it spent?"
                  />

                  {available.length > 0 ? (
                    <View className="flex-row flex-wrap gap-2">
                      {available.map((row) => (
                        <CategoryChip
                          key={row.code}
                          category={row}
                          active={row.code === categoryCode}
                          onPress={() => setCategoryCode(row.code)}
                        />
                      ))}
                    </View>
                  ) : null}

                  {/* Shown BEFORE submitting, not after. A cap the claimant
                      cannot see is one they breach by accident and get
                      questioned about later; a cap they can see makes it a
                      decision. Still not blocked — the approver decides. */}
                  {overCap && category ? (
                    <Text variant="caption" className="text-warning-ink">
                      Over the {category.name.toLowerCase()} cap of{" "}
                      {formatMoney(category.capMinorUnits ?? 0, claim.currency)}{" "}
                      — it will need sign-off.
                    </Text>
                  ) : null}

                  <ReceiptField
                    receipt={receipt}
                    required={receiptRequired}
                    onCapture={capture}
                    onClear={() => setReceipt(null)}
                  />

                  {receiptError ? (
                    <Text variant="small" className="text-danger-ink">
                      {receiptError}
                    </Text>
                  ) : null}

                  <Pressable
                    accessibilityRole="button"
                    disabled={
                      !description.trim() ||
                      parsed === null ||
                      category === null ||
                      addLine.isPending ||
                      uploading
                    }
                    onPress={addLineWithReceipt}
                    className="min-h-touch flex-row items-center justify-center gap-2 rounded-xl bg-brand-subtle active:opacity-80"
                  >
                    <Plus color={colors.brand} size={18} />
                    <Text variant="small" className="font-semibold text-brand">
                      {uploading ? "Uploading receipt…" : "Add line"}
                    </Text>
                  </Pressable>

                  {addLine.isError ? (
                    <Text variant="small" className="text-danger-ink">
                      {errorMessage(addLine.error)}
                    </Text>
                  ) : null}
                </>
              )}

              <Button
                label="Submit claim"
                block
                loading={submit.isPending}
                disabled={claim.lines.length === 0 || submit.isPending}
                haptic
                onPress={() =>
                  submit.mutate(claim._id, {
                    onSuccess: () =>
                      toast.success(
                        "Claim submitted",
                        "Your approver will review it.",
                      ),
                  })
                }
              />

              {submit.isError ? (
                <Text variant="small" className="text-danger-ink">
                  {errorMessage(submit.error)}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

/**
 * Camera first, library second, as the design draws it.
 *
 * A thumbnail once something is captured, with a clear affordance to
 * remove it — an employee who photographed the wrong receipt must be
 * able to say so before submitting, not after.
 */
function ReceiptField({
  receipt,
  required,
  onCapture,
  onClear,
}: {
  receipt: CapturedReceipt | null;
  required: boolean;
  onCapture: (source: "camera" | "library") => void;
  onClear: () => void;
}) {
  const colors = useThemeColors();
  if (receipt) {
    return (
      <View className="flex-row items-center gap-3 rounded-xl border border-border p-2">
        <Image
          source={{ uri: receipt.uri }}
          className="h-14 w-14 rounded-lg"
          resizeMode="cover"
        />
        <Text
          variant="small"
          className="flex-1 text-text-primary"
          numberOfLines={1}
        >
          {receipt.filename}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Remove receipt"
          onPress={onClear}
          hitSlop={10}
          className="p-2"
        >
          <X color={colors.textSecondary} size={18} />
        </Pressable>
      </View>
    );
  }

  return (
    <View className="gap-1">
      <View className="flex-row gap-2">
        <Pressable
          accessibilityRole="button"
          onPress={() => onCapture("camera")}
          className="min-h-touch flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-border active:bg-bg-inset"
        >
          <Camera color={colors.brand} size={18} />
          <Text variant="small" className="font-semibold text-brand">
            Take photo
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => onCapture("library")}
          className="min-h-touch flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-border active:bg-bg-inset"
        >
          <ImageIcon color={colors.brand} size={18} />
          <Text variant="small" className="font-semibold text-brand">
            Choose file
          </Text>
        </Pressable>
      </View>

      {/* Said BEFORE the attempt. The server refuses the line without
          one above the threshold, and a 400 after typing everything is
          a worse way to learn it. */}
      {required ? (
        <Text variant="caption" className="text-warning-ink">
          A receipt is required for this amount.
        </Text>
      ) : null}
    </View>
  );
}

function CategoryChip({
  category,
  active,
  onPress,
}: {
  category: ExpenseCategory;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      className={cn(
        "min-h-[38px] justify-center rounded-pill border px-3.5",
        active ? "border-brand bg-brand" : "border-border bg-bg-card",
      )}
    >
      <Text
        variant="small"
        className={
          active ? "font-semibold text-brand-ink" : "text-text-primary"
        }
      >
        {category.name}
      </Text>
    </Pressable>
  );
}

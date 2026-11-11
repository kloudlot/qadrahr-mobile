import { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { Check, ChevronDown, X } from "lucide-react-native";

import { Input } from "@/components/ui/Field";
import { Sheet } from "@/components/ui/Sheet";
import { Text } from "@/components/ui/Text";
import { cn } from "@/lib/cn";
import { useColleagues } from "@/lib/queries/people";
import { useThemeColors } from "@/lib/theme/ThemeProvider";

/** Enough to scroll; anyone further down is a search away. */
const SHOWN = 50;

/**
 * Who covers while I'm away. Optional, and searchable: a company's
 * colleague list runs to hundreds, which a plain list of options can't
 * carry. Names and numbers only — that is all `/me/colleagues` returns.
 */
export function HandoverPicker({ value, onChange }: { value: string | null; onChange: (id: string | null) => void }) {
  const colors = useThemeColors();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  // Fetched once the picker is first opened, not for every leave request.
  const [wanted, setWanted] = useState(false);
  const colleagues = useColleagues(wanted || Boolean(value));

  const selected = colleagues.data?.find((person) => person._id === value);
  const matches = useMemo(() => {
    const all = colleagues.data ?? [];
    const needle = search.trim().toLowerCase();
    const found = needle
      ? all.filter((person) =>
          `${person.firstName} ${person.lastName} ${person.employeeNumber}`.toLowerCase().includes(needle),
        )
      : all;
    return found.slice(0, SHOWN);
  }, [colleagues.data, search]);

  return (
    <>
      <View className="h-12 flex-row items-center rounded-xl bg-bg-inset">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Hand over to: ${selected ? `${selected.firstName} ${selected.lastName}` : "nobody"}`}
          onPress={() => {
            setWanted(true);
            setOpen(true);
          }}
          className="h-full flex-1 flex-row items-center justify-between px-4 active:opacity-80"
        >
          <Text variant="body" numberOfLines={1} className={selected ? "text-text-primary" : "text-text-disabled"}>
            {selected ? `${selected.firstName} ${selected.lastName}` : "No handover"}
          </Text>
          {selected ? null : <ChevronDown size={18} color={colors.textSecondary} />}
        </Pressable>
        {selected ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear the handover"
            hitSlop={8}
            onPress={() => onChange(null)}
            className="px-4 active:opacity-60"
          >
            <X size={18} color={colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      <Sheet visible={open} onClose={() => setOpen(false)} title="Hand over to">
        <Input value={search} onChangeText={setSearch} placeholder="Search by name or number" autoCorrect={false} />
        <View className="-mx-screen-x">
          {colleagues.isLoading ? (
            <Text variant="small" className="px-screen-x py-4 text-text-secondary">
              Loading colleagues…
            </Text>
          ) : matches.length === 0 ? (
            <Text variant="small" className="px-screen-x py-4 text-text-secondary">
              {colleagues.isError ? "Couldn't load your colleagues." : "Nobody matches that."}
            </Text>
          ) : (
            matches.map((person) => {
              const active = person._id === value;
              return (
                <Pressable
                  key={person._id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => {
                    onChange(person._id);
                    setOpen(false);
                    setSearch("");
                  }}
                  className="min-h-[52px] flex-row items-center gap-3 px-screen-x py-2 active:bg-bg-inset"
                >
                  <View className="flex-1">
                    <Text variant="body" className={cn(active ? "font-semibold text-brand" : "text-text-primary")}>
                      {person.firstName} {person.lastName}
                    </Text>
                    <Text variant="caption" className="text-text-secondary">
                      {person.employeeNumber}
                    </Text>
                  </View>
                  {active ? <Check size={20} color={colors.brand} /> : null}
                </Pressable>
              );
            })
          )}
        </View>
      </Sheet>
    </>
  );
}

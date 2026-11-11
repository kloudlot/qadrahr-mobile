import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { AppState, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";
import { useColorScheme, vars } from "nativewind";
import { create } from "zustand";

import { http } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";

import { brandRamp, brandVariables, parseHex, toHex, type Scheme } from "./color";
import { DEFAULT_ACCENT, TOKENS } from "./tokens";
import type { Res } from "@/lib/api/types";

/**
 * The app's theme: light or dark, and the tenant's accent.
 *
 * Two things change the colours at runtime, and neither can be compiled in:
 *
 *  - The SCHEME: the user's choice in Me → Appearance, or the phone's.
 *  - The ACCENT: a tenant's own colour, from `GET /tenants/me` after sign-in.
 *    It is cached so a cold start paints the tenant's colour immediately
 *    rather than flashing orange first, and forgotten on sign-out so the
 *    next person on a shared device does not see the last one's brand.
 *
 * The accent is applied with NativeWind's `vars()`, which overrides the
 * `--brand-*` variables for everything below it, so every `bg-brand` /
 * `text-brand` re-tints with no rebuild. Only the brand group is touched —
 * semantic colours are never tenant-overridable.
 */

export type Preference = "system" | "light" | "dark";

const PREFERENCE_KEY = "qadrahr.theme.preference";
const ACCENT_KEY = "qadrahr.theme.accent";

interface ThemeState {
  preference: Preference;
  /** The tenant's accent as last seen, or null for the default. */
  accent: string | null;
  loaded: boolean;
  load: () => Promise<void>;
  setPreference: (preference: Preference) => void;
  setAccent: (accent: string | null) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  preference: "system",
  accent: null,
  loaded: false,

  load: async () => {
    try {
      const [preference, accent] = await Promise.all([
        AsyncStorage.getItem(PREFERENCE_KEY),
        AsyncStorage.getItem(ACCENT_KEY),
      ]);
      set({
        preference: preference === "light" || preference === "dark" ? preference : "system",
        accent: parseHex(accent) ? accent : null,
        loaded: true,
      });
    } catch {
      // Unreadable storage costs a default theme, never a launch.
      set({ loaded: true });
    }
  },

  setPreference: (preference) => {
    set({ preference });
    void AsyncStorage.setItem(PREFERENCE_KEY, preference).catch(() => undefined);
  },

  setAccent: (accent) => {
    const valid = parseHex(accent) ? accent : null;
    set({ accent: valid });
    void (valid ? AsyncStorage.setItem(ACCENT_KEY, valid) : AsyncStorage.removeItem(ACCENT_KEY)).catch(
      () => undefined,
    );
  },
}));

/** Called on sign-out: the next person should not inherit this tenant's colour. */
export function forgetTenantAccent(): void {
  useThemeStore.getState().setAccent(null);
}

type TenantProfile = Res<"GET /tenants/me">;

/**
 * The signed-in tenant's name and branding. Any signed-in user may read it.
 *
 * Checked again whenever the app comes back to the foreground (if a minute
 * old), so a change made in the operator console reaches a phone that has
 * kept the app running for days, not only one that relaunches it.
 */
export function useTenantProfile() {
  const signedIn = useAuthStore((state) => Boolean(state.user) || state.hasStoredSession);
  const query = useQuery<TenantProfile>({
    queryKey: ["tenant", "me"],
    queryFn: async () => (await http.get<TenantProfile>("/tenants/me")).data,
    enabled: signedIn,
    staleTime: 60_000,
  });

  const { refetch, isStale } = query;
  useEffect(() => {
    if (!signedIn) return;
    const subscription = AppState.addEventListener("change", (status) => {
      if (status === "active" && isStale) void refetch();
    });
    return () => subscription.remove();
  }, [signedIn, isStale, refetch]);

  return query;
}

/** Resolved hex values, for the places a className cannot reach. */
export interface ThemeColors {
  scheme: Scheme;
  brand: string;
  brandHover: string;
  brandActive: string;
  brandSubtle: string;
  brandBorder: string;
  onBrand: string;
  page: string;
  card: string;
  inset: string;
  border: string;
  borderStrong: string;
  textPrimary: string;
  textBody: string;
  textSecondary: string;
  textDisabled: string;
  success: string;
  successSubtle: string;
  warning: string;
  warningSubtle: string;
  danger: string;
  dangerSubtle: string;
  info: string;
  infoSubtle: string;
  neutral: string;
  neutralSubtle: string;
}

interface ThemeContextValue {
  colors: ThemeColors;
  preference: Preference;
  setPreference: (preference: Preference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { colorScheme, setColorScheme } = useColorScheme();
  const preference = useThemeStore((state) => state.preference);
  const accent = useThemeStore((state) => state.accent);
  const setPreference = useThemeStore((state) => state.setPreference);
  const setAccent = useThemeStore((state) => state.setAccent);

  useEffect(() => {
    setColorScheme(preference);
  }, [preference, setColorScheme]);

  // Refresh the cached accent from the server once signed in.
  const tenant = useTenantProfile();
  const serverAccent = tenant.data?.branding.accentColor ?? null;
  useEffect(() => {
    if (tenant.isSuccess) setAccent(serverAccent);
  }, [tenant.isSuccess, serverAccent, setAccent]);

  const scheme: Scheme = colorScheme === "dark" ? "dark" : "light";

  const value = useMemo<ThemeContextValue>(() => {
    const ramp = brandRamp(parseHex(accent) ?? parseHex(DEFAULT_ACCENT)!, scheme);
    const t = TOKENS[scheme];
    return {
      preference,
      setPreference,
      colors: {
        scheme,
        brand: toHex(ramp.primary),
        brandHover: toHex(ramp.hover),
        brandActive: toHex(ramp.active),
        brandSubtle: toHex(ramp.subtle),
        brandBorder: toHex(ramp.border),
        onBrand: toHex(ramp.onPrimary),
        page: t.surface[0],
        card: t.surface[1],
        inset: t.surface[2],
        border: t.surface[3],
        borderStrong: t.surface[4],
        textDisabled: t.surface[5],
        textSecondary: t.surface[6],
        textBody: t.surface[7],
        textPrimary: t.surface[9],
        success: t.success,
        successSubtle: t.successSubtle,
        warning: t.warning,
        warningSubtle: t.warningSubtle,
        danger: t.danger,
        dangerSubtle: t.dangerSubtle,
        info: t.info,
        infoSubtle: t.infoSubtle,
        neutral: t.neutral,
        neutralSubtle: t.neutralSubtle,
      },
    };
  }, [accent, scheme, preference, setPreference]);

  const brandVars = useMemo(
    () => vars(brandVariables(brandRamp(parseHex(accent) ?? parseHex(DEFAULT_ACCENT)!, scheme))),
    [accent, scheme],
  );

  return (
    <ThemeContext.Provider value={value}>
      <View style={[{ flex: 1 }, brandVars]}>{children}</View>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside <ThemeProvider>");
  return context;
}

export function useThemeColors(): ThemeColors {
  return useTheme().colors;
}

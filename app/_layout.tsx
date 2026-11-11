import "../global.css";

import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { KeyboardProvider } from "react-native-keyboard-controller";
// Imported from their SUBPATHS, not from the package root.
//
// `@expo-google-fonts/inter` re-exports all eighteen weights, and the
// bundler follows that: importing four from the root shipped all eighteen,
// about 4MB of fonts nobody renders. On an app for employees paying for
// their own data, that is worth the longer import lines.
import { useFonts } from "expo-font";
import Inter_400Regular from "@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf";
import Inter_500Medium from "@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf";
import Inter_600SemiBold from "@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf";
import Inter_700Bold from "@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf";

import { queryClient } from "@/lib/queryClient";
import { setSessionEndedHandler } from "@/lib/api";
import { forgetPushRegistration } from "@/lib/push";
import { startConnectivityWatch, startFocusWatch } from "@/lib/connectivity";
import { ThemeProvider, useThemeColors, useThemeStore } from "@/lib/theme/ThemeProvider";
import { ToastHost } from "@/components/ui/Toast";
import { useAuthStore } from "@/store/useAuthStore";

void SplashScreen.preventAutoHideAsync();

// Started at module load, before any component mounts. TanStack Query has
// no online detection on React Native of its own — see lib/connectivity.ts
// — and a query that runs before the first NetInfo event would be
// attempted as though the connection were fine. Likewise focus: queries
// refetch when the app returns to the foreground only once this is wired.
startConnectivityWatch();
startFocusWatch();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const hydrate = useAuthStore((state) => state.hydrate);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const loadTheme = useThemeStore((state) => state.load);
  const themeLoaded = useThemeStore((state) => state.loaded);

  useEffect(() => {
    void hydrate();
    void loadTheme();
  }, [hydrate, loadTheme]);

  // The splash stays up until the fonts, the stored session AND the theme
  // are ready. Hiding it earlier shows a frame of fallback type, then a
  // login screen that is replaced a moment later once the session resolves
  // — which reads as the app signing you out and back in — or a flash of
  // the default colours for a dark-mode user or a branded tenant.
  const ready = fontsLoaded && isHydrated && themeLoaded;

  useEffect(() => {
    if (ready) {
      void SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {/* Tracks the keyboard on both platforms, so screens and sheets keep the focused field visible. */}
        <KeyboardProvider>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider>
              <ThemedStatusBar />
              <SessionShell />
              <ToastHost />
            </ThemeProvider>
          </QueryClientProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/**
 * Routing, gated on the session.
 *
 * Inside the providers on purpose — it subscribes to the auth store and
 * needs the query client to be present when a session ends.
 *
 * `Stack.Protected` rather than a redirect in an effect. The obvious
 * implementation is a `useEffect` that calls `router.replace()` when the
 * user goes null, and it produces "Maximum update depth exceeded" on sign
 * out: the screen being navigated away from re-renders, the effect fires
 * again, and the navigation restarts. Declaring which stack is reachable
 * lets the router resolve it in one pass.
 */
/** Dark icons on a light page and light on a dark one. Hero screens set their own. */
function ThemedStatusBar() {
  const { scheme } = useThemeColors();
  return <StatusBar style={scheme === "dark" ? "light" : "dark"} />;
}

function SessionShell() {
  const colors = useThemeColors();
  const hasStoredSession = useAuthStore((state) => state.hasStoredSession);
  const eject = useAuthStore((state) => state.eject);

  // The API client discovers a dead session — a refresh token that has been
  // spent, revoked, or superseded by a sign-in on another device. It has no
  // access to React, so it reports back through here.
  useEffect(() => {
    setSessionEndedHandler((reason) => {
      queryClient.clear();
      // The server forgot this device when the session ended; only the
      // remembered token and the icon badge are left to clear.
      void forgetPushRegistration();
      eject(reason);
    });

    return () => setSessionEndedHandler(null);
  }, [eject]);

  return (
    // The page colour behind every screen, so a push in dark mode never
    // flashes white.
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.page } }}>
      <Stack.Protected guard={!hasStoredSession}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>

      <Stack.Protected guard={hasStoredSession}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
    </Stack>
  );
}

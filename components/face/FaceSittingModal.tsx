import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Modal, Pressable, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import { X } from "lucide-react-native";

import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { errorMessage } from "@/lib/api";
import {
  parseBridgeMessage,
  sittingResult,
  type FacePurpose,
  type SittingResult,
} from "@/lib/face";
import { startFaceSession } from "@/lib/queries/face";
import { useThemeColors } from "@/lib/theme/ThemeProvider";

/**
 * A face sitting, full screen: enrolling a face, or checking one for a
 * clock-in.
 *
 * The camera work happens in a web page — the organisation's own web app,
 * opened here in a web view — so the app, the web console and anything
 * later all run one implementation of it. The app's part is small and
 * easy to get subtly wrong, which is why it lives in one component:
 *
 * 1. Take the camera permission FIRST. A web view can only be given
 *    camera access the app already holds; opened without it, the page
 *    fails with an error that reads like a bug in the web app.
 * 2. Start the sitting on the server and open the page it names. The link
 *    is the page's whole credential, good for one sitting and a few
 *    minutes: the web view is given no session of the app's.
 * 3. Wait to be told how it went, and hand that to whoever opened this.
 *
 * Nothing the page reports is trusted further than "it is finished". For
 * a punch, what the sitting proved is read by the server from its own
 * record when the punch names it.
 */
export function FaceSittingModal({
  purpose,
  visible,
  onResult,
}: {
  purpose: FacePurpose;
  visible: boolean;
  /** Called once, when the sitting ends in any way. The opener closes the modal. */
  onResult: (result: SittingResult) => void;
}) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  // "Try again" starts a new sitting by mounting a fresh one.
  const [attempt, setAttempt] = useState(0);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => onResult({ kind: "abandoned" })}
    >
      <View className="flex-1 bg-bg-page" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center justify-between px-4 py-2">
          <Text variant="h3" className="text-text-primary">
            {purpose === "enrol" ? "Set up face check" : "Face check"}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            hitSlop={12}
            onPress={() => onResult({ kind: "abandoned" })}
          >
            <X size={24} color={colors.textBody} />
          </Pressable>
        </View>
        {/* Mounted only while open, and afresh for each attempt: every
            sitting starts from nothing, with no state left from the last. */}
        {visible ? (
          <Sitting
            key={attempt}
            purpose={purpose}
            bottomInset={insets.bottom}
            onResult={onResult}
            onRetry={() => setAttempt((n) => n + 1)}
          />
        ) : null}
      </View>
    </Modal>
  );
}

function Sitting({
  purpose,
  bottomInset,
  onResult,
  onRetry,
}: {
  purpose: FacePurpose;
  bottomInset: number;
  onResult: (result: SittingResult) => void;
  onRetry: () => void;
}) {
  const colors = useThemeColors();
  const [session, setSession] = useState<{ sessionId: string; url: string } | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  // A page can post its last message twice (a retry, a re-render). The
  // opener hears about the ending once.
  const settledRef = useRef(false);

  const settle = useCallback(
    (result: SittingResult) => {
      if (settledRef.current) return;
      settledRef.current = true;
      onResult(result);
    },
    [onResult],
  );

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const existing = await ImagePicker.getCameraPermissionsAsync();
        const permission = existing.granted ? existing : await ImagePicker.requestCameraPermissionsAsync();
        if (cancelled) return;
        if (!permission.granted) {
          setProblem(
            "Camera access is needed for the face check. Allow it for this app in your phone's settings, then try again.",
          );
          return;
        }
        const started = await startFaceSession(purpose);
        if (!cancelled) setSession({ sessionId: started.sessionId, url: started.url });
      } catch (error) {
        if (!cancelled) setProblem(errorMessage(error));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [purpose]);

  const onMessage = useCallback(
    (event: WebViewMessageEvent) => {
      if (!session) return;
      const message = parseBridgeMessage(event.nativeEvent.data);
      if (!message) return;
      const result = sittingResult(message, session.sessionId);
      if (result) settle(result);
    },
    [session, settle],
  );

  if (problem) {
    return (
      <View className="flex-1 items-center justify-center gap-5 px-8">
        <Text variant="body" className="text-center text-text-secondary">
          {problem}
        </Text>
        <View className="w-full gap-3">
          <Button label="Try again" size="lg" block onPress={onRetry} />
          <Button
            label="Close"
            variant="secondary"
            size="lg"
            block
            onPress={() => settle({ kind: "failed", message: problem })}
          />
        </View>
      </View>
    );
  }

  if (!session) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color={colors.textBody} />
      </View>
    );
  }

  return (
    <WebView
      source={{ uri: session.url }}
      onMessage={onMessage}
      // The camera, inline and without a tap: this is a camera page.
      mediaPlaybackRequiresUserAction={false}
      allowsInlineMediaPlayback
      // iOS: the app already holds the permission (taken above), so do not
      // ask a second time on the page's behalf.
      mediaCapturePermissionGrantType="grant"
      javaScriptEnabled
      domStorageEnabled
      // One page, one job. Nothing else may be opened from it.
      setSupportMultipleWindows={false}
      onShouldStartLoadWithRequest={(request) => sameOrigin(request.url, session.url)}
      onError={() => setProblem("The face check couldn't be opened. Check your connection and try again.")}
      onHttpError={() => setProblem("The face check couldn't be opened. Try again in a moment.")}
      startInLoadingState
      renderLoading={() => (
        <View className="absolute inset-0 items-center justify-center bg-bg-page">
          <ActivityIndicator color={colors.textBody} />
        </View>
      )}
      style={{ flex: 1, marginBottom: bottomInset }}
    />
  );
}

/** Whether a navigation stays on the capture page's own site. */
function sameOrigin(url: string, pageUrl: string): boolean {
  const origin = (value: string) => /^[a-z]+:\/\/[^/]+/i.exec(value)?.[0]?.toLowerCase();
  // about:blank and data: frames are the page's own; anything with another host is not.
  return !/^https?:/i.test(url) || origin(url) === origin(pageUrl);
}

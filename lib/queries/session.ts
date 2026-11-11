import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMe, sessionUserFromContext } from "@/lib/session";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * Validates a stored session against the server.
 *
 * `hasStoredSession` only means tokens exist on the device. This is what
 * turns that into a signed-in user — and, when the tokens are dead, what
 * ends the session rather than leaving a shell that 401s on every screen.
 */
export function useSession() {
  const user = useAuthStore((state) => state.user);
  const hasStoredSession = useAuthStore((state) => state.hasStoredSession);
  const signedIn = useAuthStore((state) => state.signedIn);

  const query = useQuery({
    queryKey: ["session", "me"],
    queryFn: fetchMe,
    enabled: hasStoredSession && !user,
    // A 401 here means the session is over; the API client has already
    // cleared it. Retrying would just repeat that.
    retry: false,
  });

  useEffect(() => {
    if (query.data) {
      // No company header is set here. /auth/me does not say which
      // company to act as, and the server infers the default for a user
      // who belongs to one — see the note on `signedIn`.
      signedIn(sessionUserFromContext(query.data));
    }
  }, [query.data, signedIn]);

  return { user, isLoading: query.isLoading && !user, error: query.error };
}

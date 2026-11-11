import { QueryClient } from "@tanstack/react-query";
import { http, setActiveCompany } from "./api";
import { unregisterFromPush } from "./push";
import { flushQueue, forgetQueuedPunches } from "./punchSync";
import { rememberTenant } from "./rememberedTenant";
import { clearTokens, writeTokens } from "./storage";
import { forgetTenantAccent } from "./theme/ThemeProvider";
import {
  useAuthStore,
  type MfaChallenge,
  type PasswordChangeChallenge,
  type SessionUser,
} from "@/store/useAuthStore";
import type { Res } from "@/lib/api/types";

/** The token pair a sign-in ends with (`TokenPairDto`). */
type LoginResponse = Res<"POST /auth/mfa/verify">;

/** `AuthContextDto`: the access token decoded — `userId`, not `id`, and no name. */
type AuthContext = Res<"GET /auth/me">;

export type SignInResult =
  | { status: "signed_in"; user: SessionUser }
  | { status: "mfa_required"; challenge: MfaChallenge }
  | { status: "password_change_required"; challenge: PasswordChangeChallenge };

/**
 * Narrows on the PRESENCE of `mfaRequired`, not the absence of a token.
 *
 * `!accessToken` would work today and break the first time the token
 * pair gains an optional field. The server declares `mfaRequired: true`
 * on the challenge and nowhere else, precisely so clients have something
 * positive to test.
 */
function needsMfa(body: object): body is MfaChallenge {
  return "mfaRequired" in body;
}

/** Same rule: the server declares `passwordChangeRequired: true` here and nowhere else. */
function needsPasswordChange(body: object): body is PasswordChangeChallenge {
  return "passwordChangeRequired" in body;
}

export async function signIn(email: string, password: string): Promise<SignInResult> {
  const { data } = await http.post<Res<"POST /auth/login">>("/auth/login", {
    email,
    password,
  });

  if (needsPasswordChange(data)) {
    useAuthStore.getState().passwordChangeRequired(data);
    return { status: "password_change_required", challenge: data };
  }
  if (needsMfa(data)) {
    useAuthStore.getState().mfaRequired(data);
    return { status: "mfa_required", challenge: data };
  }

  await completeSignIn(data as LoginResponse);
  return { status: "signed_in", user: (data as LoginResponse).user };
}

/**
 * Replaces a password someone else chose (provisioning, an admin), then
 * carries on as a sign-in: a session, or the second factor if it is on.
 *
 * Unlike the MFA challenge, this one survives a refused password (too
 * short, or the same as before), so the screen may let the user try again.
 */
export async function firstPasswordChange(
  challengeToken: string,
  newPassword: string,
): Promise<Exclude<SignInResult, { status: "password_change_required" }>> {
  const { data } = await http.post<Res<"POST /auth/password/first-change">>(
    "/auth/password/first-change",
    { challengeToken, newPassword },
  );

  useAuthStore.getState().passwordChangeAbandoned();
  if (needsMfa(data)) {
    useAuthStore.getState().mfaRequired(data);
    return { status: "mfa_required", challenge: data };
  }
  await completeSignIn(data as LoginResponse);
  return { status: "signed_in", user: (data as LoginResponse).user };
}

/**
 * Exchanges a challenge and a code for a session.
 *
 * The challenge is spent on FIRST use whether or not the code was right
 * — otherwise a six-digit code would have unlimited attempts. So a
 * rejection here is terminal for this attempt: the caller must send the
 * user back to sign in, not re-prompt for another code against a
 * challenge the server has already discarded.
 */
export async function verifyMfa(challengeToken: string, code: string): Promise<SessionUser> {
  const { data } = await http.post<Res<"POST /auth/mfa/verify">>("/auth/mfa/verify", {
    challengeToken,
    code: code.trim(),
  });

  await completeSignIn(data);
  return data.user;
}

async function completeSignIn(data: LoginResponse): Promise<void> {
  await writeTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
  // So the sign-in screen opens in this employer's name next time.
  await rememberTenant({ tenantId: data.user.tenantId, email: data.user.email });
  useAuthStore.getState().signedIn(data.user);
}

/** The current user, per the server. Used to validate a stored session. */
export async function fetchMe(): Promise<AuthContext> {
  const { data } = await http.get<Res<"GET /auth/me">>("/auth/me");
  return data;
}

/** `AuthContextDto` -> the store's shape. The names are simply not there. */
export function sessionUserFromContext(context: AuthContext): SessionUser {
  return {
    id: context.userId,
    email: context.email,
    tenantId: context.tenantId,
    roleIds: context.roleIds,
  };
}

/** Bounds a step that must not trap someone on a bad connection. */
function atMost<T>(work: Promise<T>, ms: number): Promise<T | void> {
  return Promise.race([work, new Promise<void>((resolve) => setTimeout(resolve, ms))]);
}

/**
 * Ends the session, locally first.
 *
 * Four things outlive a token and each has to be dealt with explicitly:
 *
 *   1. The push registration. This one is AWAITED, and it has to happen
 *      BEFORE the tokens are cleared — the request interceptor reads them
 *      from storage at request time, so a fire-and-forget delete would
 *      race the clear and go out unauthenticated. It is worth waiting for
 *      because failing it leaks one employee's payslip alerts to whoever
 *      holds the phone next, which on a shared shift device is the whole
 *      point. Bounded at three seconds so a dead connection still lets
 *      someone sign out of a device they are trying to hand back.
 *   2. The tokens on the device. Cleared next, so that even if everything
 *      below fails the credentials are gone.
 *   3. Cached server state in TanStack Query. Someone else signing in on
 *      this device must not see the previous employee's payslips flash up
 *      before the new data loads.
 *   4. The server's record of the session. Fired WITHOUT awaiting — it is a
 *      courtesy that lets the backend drop the refresh token early. Making
 *      sign-out wait on it means a user on a bad connection cannot sign out
 *      of a device they are trying to hand back, which is exactly when they
 *      most want to.
 */
export async function signOut(queryClient: QueryClient): Promise<void> {
  const userId = useAuthStore.getState().user?.id;

  // One last attempt to deliver anything queued, while the token is
  // still valid. Bounded for the same reason as the push unregister.
  if (userId) await atMost(flushQueue(userId), 3000);

  await atMost(unregisterFromPush(), 3000);

  void http.post("/auth/logout").catch(() => {
    // Nothing to do. The tokens are already gone from this device, and the
    // refresh token expires on its own.
  });

  await clearTokens();
  setActiveCompany(null);
  queryClient.clear();
  // Back to the default colour in the app's theme. The sign-in screen
  // re-applies the remembered organisation's own (lib/rememberedTenant.ts),
  // which on a shared device is still the right employer.
  forgetTenantAccent();

  // Anything still queued is dropped, and this is deliberate. A shared
  // shift device is the case that forces it: an unflushed punch
  // belonging to this employee would otherwise be sent under the NEXT
  // employee's bearer token and attributed to them — a buddy-punch the
  // app created by itself.
  //
  // The cost is a lost punch for someone who clocks in offline and then
  // signs out before regaining signal. That is the right trade, and it
  // is recoverable: HR can add a missing punch. The alternative is not.
  if (userId) await forgetQueuedPunches(userId);

  useAuthStore.getState().clear();
}

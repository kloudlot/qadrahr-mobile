import { create } from "zustand";
import { readTokens } from "@/lib/storage";
import type { MfaChallengeDto, PasswordChangeChallengeDto } from "@/lib/api/schema";

/**
 * Who is signed in, and whether we have finished finding out.
 *
 * Client state only. Anything the server owns — leave balances, payslips,
 * today's attendance — is a TanStack Query, never mirrored in here. Two
 * copies of server state is how a screen ends up showing a balance that
 * disagrees with the one behind it.
 */

/**
 * The signed-in user, as the API actually describes them.
 *
 * Two endpoints populate this and they do not agree, which is why the
 * names are optional. `POST /auth/login` returns a full user. `GET
 * /auth/me` decodes the access token and returns identity only — no
 * name, because the name is not in the token and the endpoint does no
 * database read. So after a cold start the names are absent until
 * something fetches the profile.
 *
 * Anything needing a display name should read `GET /me/profile` as a
 * query rather than reaching in here, for the reason in the comment
 * above: server state belongs in TanStack Query.
 *
 * There is deliberately no `employeeId` and no `defaultCompanyId`. An
 * earlier version of this file declared both; neither has ever been
 * returned by any endpoint, so both were always undefined.
 */
export interface SessionUser {
  id: string;
  email: string;
  tenantId: string;
  roleIds: string[];
  firstName?: string;
  lastName?: string;
}

/**
 * Why a session ended, when it ended on its own.
 *
 * Distinguished because the recovery differs: an expired session wants a
 * quiet return to login, while a session taken over on another device needs
 * saying out loud — the backend enforces one session per user, so signing in
 * elsewhere silently signs you out here, and an employee who is not told
 * that assumes the app is broken.
 */
export type Ejection = "expired" | "signed_in_elsewhere";

/**
 * A sign-in that stopped at the second factor. `MfaChallengeDto`.
 *
 * Held here rather than passed as a route param on purpose: the token is
 * a credential, and route params end up in navigation state, which can
 * be serialised and restored. This store is memory-only, so the
 * challenge dies with the app — which is correct for something that
 * lasts five minutes and can be used once.
 */
/** What a sign-in returns when a second factor is owed (`MfaChallengeDto`). */
export type MfaChallenge = MfaChallengeDto;

/** What a sign-in returns when the password was chosen by someone else. */
export type PasswordChangeChallenge = PasswordChangeChallengeDto;

interface AuthState {
  user: SessionUser | null;
  /** The company acting scope. Sent as `x-company-id` on every request. */
  companyId: string | null;
  /** Tokens exist on this device. Not the same as being signed in. */
  hasStoredSession: boolean;
  /** False until storage has been read. Routing waits on this. */
  isHydrated: boolean;
  ejection: Ejection | null;
  /** Set between a password and its second factor. Never persisted. */
  pendingMfa: MfaChallenge | null;
  /** Set between a password someone else chose and the user's own. Never persisted. */
  pendingPasswordChange: PasswordChangeChallenge | null;

  hydrate: () => Promise<void>;
  signedIn: (user: SessionUser) => void;
  mfaRequired: (challenge: MfaChallenge) => void;
  mfaAbandoned: () => void;
  passwordChangeRequired: (challenge: PasswordChangeChallenge) => void;
  passwordChangeAbandoned: () => void;
  setCompany: (companyId: string) => void;
  eject: (reason: Ejection) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  companyId: null,
  hasStoredSession: false,
  isHydrated: false,
  ejection: null,
  pendingMfa: null,
  pendingPasswordChange: null,

  /**
   * Reads the stored session on launch.
   *
   * Establishes only whether tokens EXIST — deliberately not who they belong
   * to. A token that survived on the device may have been revoked while the
   * app was closed (the backend enforces one session per user, so signing in
   * on another device ends this one). Trusting a cached profile would render
   * a signed-in shell that 401s on its first request, which reads to the
   * employee as the app being broken rather than as being signed out.
   *
   * So `hasStoredSession` gets someone past the login screen, and
   * `GET /auth/me` decides whether they stay.
   */
  hydrate: async () => {
    const tokens = await readTokens();
    set({ hasStoredSession: Boolean(tokens), isHydrated: true });
  },

  /**
   * `companyId` is left alone on purpose.
   *
   * Nothing in the login response says which company to act as, and
   * sending `x-company-id: undefined` is indistinguishable from sending
   * no header — which is why the bug this replaces was invisible. The
   * server's CompanyScopeGuard infers the default for a user who belongs
   * to one company, which is almost everyone. The header is only needed
   * once a user genuinely has a choice, and then it is `setCompany` that
   * makes it.
   */
  signedIn: (user) =>
    set({
      user,
      hasStoredSession: true,
      ejection: null,
      pendingMfa: null,
      pendingPasswordChange: null,
    }),

  mfaRequired: (challenge) => set({ pendingMfa: challenge, pendingPasswordChange: null, ejection: null }),

  mfaAbandoned: () => set({ pendingMfa: null }),

  passwordChangeRequired: (challenge) => set({ pendingPasswordChange: challenge, ejection: null }),

  passwordChangeAbandoned: () => set({ pendingPasswordChange: null }),

  setCompany: (companyId) => set({ companyId }),

  eject: (reason) =>
    set({
      user: null,
      companyId: null,
      hasStoredSession: false,
      ejection: reason,
      pendingMfa: null,
      pendingPasswordChange: null,
    }),

  clear: () =>
    set({
      user: null,
      companyId: null,
      hasStoredSession: false,
      ejection: null,
      pendingMfa: null,
      pendingPasswordChange: null,
    }),
}));

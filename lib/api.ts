import type { Res } from "@/lib/api/types";
import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { API_URL, PRODUCT_NAME, REFRESH_SKEW_SECONDS, REQUEST_TIMEOUT_MS } from "./env";
import { clearTokens, readExpiry, readTokens, writeTokens } from "./storage";

/**
 * The one HTTP client.
 *
 * Everything the app sends goes through here so that three concerns are
 * handled once rather than at every call site: attaching the bearer token,
 * keeping it fresh, and scoping the request to a company.
 */
export const http = axios.create({
  baseURL: API_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { "Content-Type": "application/json" },
});

/** The company the user is currently acting in. Sent as `x-company-id`. */
let activeCompanyId: string | null = null;

export function setActiveCompany(companyId: string | null): void {
  activeCompanyId = companyId;
}

/** Why a session finished: it ran out, or a sign-in on another device took it over. */
export type SessionEndReason = "expired" | "signed_in_elsewhere";

/** Called when the session is finished and the app should return to login. */
let onSessionEnded: ((reason: SessionEndReason) => void) | null = null;

export function setSessionEndedHandler(
  handler: ((reason: SessionEndReason) => void) | null,
): void {
  onSessionEnded = handler;
}

/**
 * The in-flight refresh, if there is one.
 *
 * Single-flight matters more than it looks. A screen that mounts four
 * queries at once, with an access token about to expire, would otherwise
 * fire four refreshes. The backend rotates the refresh token on every use.
 * It answers repeats of one token within 30 seconds with the same new pair,
 * but a repeat after that is refused and ends the session. Concurrent
 * requests share one refresh, so it never comes to that.
 */
let inFlightRefresh: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const tokens = await readTokens();
  if (!tokens) return null;

  try {
    // A bare axios call, not `http`: the interceptors below would try to
    // refresh this request too.
    const response = await axios.post<Res<"POST /auth/refresh">>(
      `${API_URL}/auth/refresh`,
      { refreshToken: tokens.refreshToken },
      { timeout: REQUEST_TIMEOUT_MS },
    );

    await writeTokens(response.data);
    return response.data.accessToken;
  } catch (error) {
    // The refresh token is spent, revoked, or the session was ended from
    // another device. Either way this session is over. One person has one
    // session, so the server says when a sign-in elsewhere took it over.
    const reason = (error as AxiosError<{ reason?: string }>).response?.data?.reason;
    await clearTokens();
    onSessionEnded?.(reason === "signed_in_elsewhere" ? "signed_in_elsewhere" : "expired");
    return null;
  }
}

function refreshOnce(): Promise<string | null> {
  inFlightRefresh ??= refreshAccessToken().finally(() => {
    inFlightRefresh = null;
  });

  return inFlightRefresh;
}

http.interceptors.request.use(async (config) => {
  const tokens = await readTokens();
  if (!tokens) return config;

  let accessToken = tokens.accessToken;

  // Proactive refresh: renew shortly BEFORE expiry rather than after a 401,
  // so the user does not watch a request stall and retry mid-action.
  const expiry = readExpiry(accessToken);
  const expiringSoon =
    expiry === null || expiry - Math.floor(Date.now() / 1000) < REFRESH_SKEW_SECONDS;

  if (expiringSoon) {
    accessToken = (await refreshOnce()) ?? accessToken;
  }

  config.headers.set("Authorization", `Bearer ${accessToken}`);
  if (activeCompanyId) {
    config.headers.set("x-company-id", activeCompanyId);
  }

  return config;
});

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const request = error.config as (AxiosRequestConfig & { _retried?: boolean }) | undefined;

    // Retry ONCE. If the refreshed token is also rejected the session is
    // genuinely finished, and looping would turn an expired login into a
    // request storm against the API.
    if (error.response?.status === 401 && request && !request._retried) {
      request._retried = true;

      const accessToken = await refreshOnce();
      if (accessToken) {
        request.headers = { ...request.headers, Authorization: `Bearer ${accessToken}` };
        return http.request(request);
      }
    }

    return Promise.reject(error);
  },
);

/**
 * The API's error envelope.
 *
 * `HttpExceptionFilter` on the backend returns a consistent shape, so a
 * message worth showing is usually present. `message` can be a string or an
 * array of validation failures.
 */
interface ApiErrorBody {
  statusCode?: number;
  error?: string;
  message?: string | string[];
}

/**
 * Turns any thrown value into something showable.
 *
 * Every screen needs this and none of them should be writing it, or the app
 * ends up with a different tone of voice per screen and a raw axios message
 * leaking through somewhere.
 */
export function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as ApiErrorBody | undefined;
    const message = body?.message;

    if (Array.isArray(message) && message[0]) return message[0];
    if (typeof message === "string" && message) return message;

    if (error.code === "ECONNABORTED") {
      return "That took too long. Check your connection and try again.";
    }
    if (!error.response) {
      return `Can't reach ${PRODUCT_NAME}. Check your connection and try again.`;
    }
  }

  return "Something went wrong. Try again.";
}

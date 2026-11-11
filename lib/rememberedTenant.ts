import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useEffect } from "react";

import { http } from "./api";
import type { Res } from "./api/types";

/**
 * The organisation and work email this phone last signed in with.
 *
 * Sign-in resolves the tenant from the email, so the sign-in screen has no
 * way to know whose it is. Remembering it lets the screen open already in
 * the employer's name and colour with the email filled in — screen 01's
 * "remembered tenant". "Not you?" on that screen forgets it.
 *
 * AsyncStorage, not SecureStore: an employer's id and a work email are not
 * credentials, and the tokens that are stay in lib/storage.ts. Survives
 * sign-out on purpose — remembering across a sign-out is the feature. A
 * shared shift device belongs to one employer, so its branding is still
 * right for the next person, and "Not you?" is one tap.
 */
export interface RememberedTenant {
  tenantId: string;
  email: string;
}

const STORAGE_KEY = "qadrahr.rememberedTenant.v1";
const QUERY_KEY = ["remembered-tenant"] as const;

export type SignInBranding = Res<"GET /public/tenants/{tenantId}/branding">;

export async function readRememberedTenant(): Promise<RememberedTenant | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<RememberedTenant>;
    return typeof parsed.tenantId === "string" && typeof parsed.email === "string"
      ? { tenantId: parsed.tenantId, email: parsed.email }
      : null;
  } catch {
    return null;
  }
}

export async function rememberTenant(value: RememberedTenant): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Next sign-in just starts blank.
  }
}

export async function forgetRememberedTenant(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    /* nothing to forget */
  }
}

/**
 * The remembered organisation and its sign-in branding, for screen 01.
 *
 * `branding` is null while loading, on a first launch, or offline — the
 * screen falls back to the product's own name, and sign-in works the same
 * either way. An organisation the API no longer knows is forgotten.
 */
export function useRememberedTenant() {
  const queryClient = useQueryClient();
  const remembered = useQuery({
    queryKey: QUERY_KEY,
    queryFn: readRememberedTenant,
    staleTime: Infinity,
    networkMode: "always",
  });
  const tenantId = remembered.data?.tenantId;

  const branding = useQuery({
    queryKey: [...QUERY_KEY, "branding", tenantId],
    queryFn: async () =>
      (await http.get<SignInBranding>(`/public/tenants/${encodeURIComponent(tenantId!)}/branding`)).data,
    enabled: !!tenantId,
    staleTime: 5 * 60_000,
    retry: false,
  });

  const gone = isAxiosError(branding.error) && branding.error.response?.status === 404;
  useEffect(() => {
    if (!gone) return;
    void forgetRememberedTenant().then(() => queryClient.setQueryData(QUERY_KEY, null));
  }, [gone, queryClient]);

  return {
    remembered: remembered.data ?? null,
    loaded: !remembered.isPending,
    branding: tenantId ? (branding.data ?? null) : null,
    forget: async () => {
      await forgetRememberedTenant();
      queryClient.setQueryData(QUERY_KEY, null);
    },
  };
}

const mockPost = jest.fn();
jest.mock("./api", () => ({
  http: { post: (...args: unknown[]) => mockPost(...args), get: jest.fn() },
  setActiveCompany: jest.fn(),
}));
jest.mock("./push", () => ({ unregisterFromPush: jest.fn() }));
jest.mock("./punchSync", () => ({
  flushQueue: jest.fn(),
  forgetQueuedPunches: jest.fn(),
}));
jest.mock("./rememberedTenant", () => ({
  rememberTenant: jest.fn(async () => undefined),
}));
jest.mock("./storage", () => ({
  clearTokens: jest.fn(),
  writeTokens: jest.fn(async () => undefined),
}));
jest.mock("./theme/ThemeProvider", () => ({ forgetTenantAccent: jest.fn() }));

import { firstPasswordChange, signIn } from "./session";
import { useAuthStore } from "@/store/useAuthStore";

const user = {
  id: "u1",
  email: "ada@acme.test",
  firstName: "Ada",
  lastName: "O",
  tenantId: "acme",
  roleIds: [],
};
const tokens = { accessToken: "a", refreshToken: "r", user };

describe("signing in with a password someone else chose", () => {
  beforeEach(() => {
    mockPost.mockReset();
    useAuthStore.setState({
      pendingMfa: null,
      pendingPasswordChange: null,
      user: null,
      hasStoredSession: false,
    });
  });

  it("stops at the password change, with no session", async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        passwordChangeRequired: true,
        challengeToken: "c1",
        expiresInSeconds: 600,
      },
    });

    const result = await signIn("ada@acme.test", "given-by-admin");

    expect(result).toEqual({
      status: "password_change_required",
      challenge: {
        passwordChangeRequired: true,
        challengeToken: "c1",
        expiresInSeconds: 600,
      },
    });
    expect(useAuthStore.getState().pendingPasswordChange?.challengeToken).toBe(
      "c1",
    );
    expect(useAuthStore.getState().hasStoredSession).toBe(false);
  });

  it("signs in once the new password is set", async () => {
    useAuthStore.setState({
      pendingPasswordChange: {
        passwordChangeRequired: true,
        challengeToken: "c1",
        expiresInSeconds: 600,
      },
    });
    mockPost.mockResolvedValueOnce({ data: tokens });

    const result = await firstPasswordChange("c1", "my own passphrase");

    expect(mockPost).toHaveBeenCalledWith("/auth/password/first-change", {
      challengeToken: "c1",
      newPassword: "my own passphrase",
    });
    expect(result).toEqual({ status: "signed_in", user });
    expect(useAuthStore.getState().pendingPasswordChange).toBeNull();
    expect(useAuthStore.getState().hasStoredSession).toBe(true);
  });

  it("goes on to the second factor when one is on", async () => {
    mockPost.mockResolvedValueOnce({
      data: { mfaRequired: true, challengeToken: "m1", expiresInSeconds: 300 },
    });

    const result = await firstPasswordChange("c1", "my own passphrase");

    expect(result.status).toBe("mfa_required");
    expect(useAuthStore.getState().pendingMfa?.challengeToken).toBe("m1");
    expect(useAuthStore.getState().hasStoredSession).toBe(false);
  });
});

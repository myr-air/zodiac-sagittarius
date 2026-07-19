import { describe, expect, it, vi } from "vitest";
import {
  ACCOUNT_SESSION_STORAGE_KEY,
  canSubmitPasswordRegister,
  canSubmitPasswordSignIn,
  loadAccountSession,
  passwordRegisterErrorPresentation,
  passwordRegisterUiFields,
  passwordSignInErrorPresentation,
  registerWithPassword,
  signInWithPassword,
  type StorageLike,
} from "./password-session";

/** Independent DESIGN.md danger token names (not read from the helper under test). */
const DANGER_TEXT_TOKEN = "--color-danger";
const DANGER_SOFT_TOKEN = "--color-danger-soft";
const DANGER_BORDER_TOKEN = "--color-danger-border";

const USER_ID = "018f4e80-0000-7000-a000-000000000001";
const SESSION_TOKEN = "account-session-token-xyz";

const ACCOUNT_SESSION_BODY = {
  userId: USER_ID,
  sessionToken: SESSION_TOKEN,
  kind: "temporary",
  trustedDeviceId: null,
  createdAt: "2026-07-19T00:00:00Z",
  expiresAt: "2026-07-20T00:00:00Z",
};

function memoryStorage(initial: Record<string, string> = {}): StorageLike & {
  data: Record<string, string>;
} {
  const data = { ...initial };
  return {
    data,
    getItem(key: string) {
      return key in data ? data[key]! : null;
    },
    setItem(key: string, value: string) {
      data[key] = value;
    },
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("signInWithPassword", () => {
  it("posts login credentials to password sessions and persists sessionToken", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      jsonResponse(ACCOUNT_SESSION_BODY),
    );
    const storage = memoryStorage();

    const outcome = await signInWithPassword(
      {
        email: "traveler@example.com",
        password: "correct-horse-battery",
        trustDevice: false,
        deviceLabel: "Joii web",
      },
      {
        fetch: fetchMock,
        apiBaseUrl: "http://127.0.0.1:5181",
        storage,
      },
    );

    expect(outcome.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("http://127.0.0.1:5181/api/v1/auth/password/sessions");
    expect(init?.method).toBe("POST");
    expect(init?.body).toBe(
      JSON.stringify({
        flow: "login",
        email: "traveler@example.com",
        password: "correct-horse-battery",
        trustDevice: false,
        deviceLabel: "Joii web",
      }),
    );

    const headers = new Headers(init?.headers);
    expect(headers.get("Content-Type")).toMatch(/application\/json/i);

    expect(loadAccountSession(storage)?.sessionToken).toBe(SESSION_TOKEN);
    expect(storage.data[ACCOUNT_SESSION_STORAGE_KEY]).toBeTruthy();
  });
});

describe("registerWithPassword", () => {
  it("posts register flow to password sessions, stores the account session, and navigates to /trips", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      jsonResponse(ACCOUNT_SESSION_BODY),
    );
    const storage = memoryStorage();
    const navigate = vi.fn();

    const outcome = await registerWithPassword(
      {
        email: "new.traveler@example.com",
        password: "correct-horse-battery",
        trustDevice: false,
        deviceLabel: "Joii web",
      },
      {
        fetch: fetchMock,
        apiBaseUrl: "http://127.0.0.1:5181",
        storage,
        navigate,
      },
    );

    expect(outcome.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("http://127.0.0.1:5181/api/v1/auth/password/sessions");
    expect(init?.method).toBe("POST");
    expect(init?.body).toBe(
      JSON.stringify({
        flow: "register",
        email: "new.traveler@example.com",
        password: "correct-horse-battery",
        trustDevice: false,
        deviceLabel: "Joii web",
      }),
    );

    const headers = new Headers(init?.headers);
    expect(headers.get("Content-Type")).toMatch(/application\/json/i);

    expect(loadAccountSession(storage)?.sessionToken).toBe(SESSION_TOKEN);
    expect(storage.data[ACCOUNT_SESSION_STORAGE_KEY]).toBeTruthy();
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith("/trips");
  });

  it("keeps register to email/password/confirm and surfaces duplicate/invalid errors inline", async () => {
    expect(passwordRegisterUiFields.confirmPassword).toEqual({
      id: "reg-password2",
      name: "passwordConfirm",
      label: "Confirm password",
      autocomplete: "new-password",
    });
    expect(canSubmitPasswordRegister({
      email: "ada@example.com",
      password: "correct-horse",
      confirmPassword: "correct-horse",
    })).toBe(true);
    expect(canSubmitPasswordRegister({
      email: "ada@example.com",
      password: "short",
      confirmPassword: "short",
    })).toBe(false);
    expect(canSubmitPasswordRegister({
      email: "ada@example.com",
      password: "correct-horse",
      confirmPassword: "other-horse",
    })).toBe(false);

    const fetchMock = vi.fn<typeof fetch>(async () =>
      jsonResponse(ACCOUNT_SESSION_BODY),
    );
    const storage = memoryStorage();
    const navigate = vi.fn();

    const outcome = await registerWithPassword(
      {
        email: "ada@example.com",
        password: "correct-horse-battery",
        trustDevice: false,
        deviceLabel: "Joii web",
      },
      {
        fetch: fetchMock,
        apiBaseUrl: "http://127.0.0.1:5181",
        storage,
        navigate,
      },
    );

    expect(outcome.ok).toBe(true);
    const body = JSON.parse(String(fetchMock.mock.calls[0]![1]?.body)) as Record<
      string,
      unknown
    >;
    expect(body).toEqual({
      flow: "register",
      email: "ada@example.com",
      password: "correct-horse-battery",
      trustDevice: false,
      deviceLabel: "Joii web",
    });
    expect(body).not.toHaveProperty("firstName");
    expect(body).not.toHaveProperty("lastName");
    expect(body).not.toHaveProperty("confirmPassword");

    const duplicate = passwordRegisterErrorPresentation({
      ok: false,
      error: "An account with this email already exists.",
    });
    expect(duplicate.visible).toBe(true);
    expect(["form", "field"]).toContain(duplicate.scope);
    expect(duplicate.message).toBe("An account with this email already exists.");
    expect(duplicate.tokens.text).toBe(DANGER_TEXT_TOKEN);
    expect(duplicate.tokens.soft).toBe(DANGER_SOFT_TOKEN);
    expect(duplicate.tokens.border).toBe(DANGER_BORDER_TOKEN);

    const invalid = passwordRegisterErrorPresentation({
      ok: false,
      error: "Email or password is invalid.",
    });
    expect(invalid.visible).toBe(true);
    expect(["form", "field"]).toContain(invalid.scope);
    expect(invalid.message).toBe("Email or password is invalid.");
    expect(invalid.tokens.text).toBe(DANGER_TEXT_TOKEN);
    expect(invalid.tokens.soft).toBe(DANGER_SOFT_TOKEN);
    expect(invalid.tokens.border).toBe(DANGER_BORDER_TOKEN);
  });
});

describe("password sign-in submit and error presentation", () => {
  it("keeps submit disabled until email and password are non-empty and surfaces API/network failures as visible danger inline errors", () => {
    expect(canSubmitPasswordSignIn({ email: "", password: "" })).toBe(false);
    expect(
      canSubmitPasswordSignIn({ email: "traveler@example.com", password: "" }),
    ).toBe(false);
    expect(
      canSubmitPasswordSignIn({ email: "", password: "correct-horse-battery" }),
    ).toBe(false);
    expect(
      canSubmitPasswordSignIn({
        email: "   ",
        password: "correct-horse-battery",
      }),
    ).toBe(false);
    expect(
      canSubmitPasswordSignIn({
        email: "traveler@example.com",
        password: "   ",
      }),
    ).toBe(false);
    expect(
      canSubmitPasswordSignIn({
        email: "traveler@example.com",
        password: "correct-horse-battery",
      }),
    ).toBe(true);

    const apiFailure = passwordSignInErrorPresentation({
      ok: false,
      error: "Invalid email or password.",
    });
    expect(apiFailure.visible).toBe(true);
    expect(["form", "field"]).toContain(apiFailure.scope);
    expect(apiFailure.message).toBe("Invalid email or password.");
    expect(apiFailure.tokens.text).toBe(DANGER_TEXT_TOKEN);
    expect(apiFailure.tokens.soft).toBe(DANGER_SOFT_TOKEN);
    expect(apiFailure.tokens.border).toBe(DANGER_BORDER_TOKEN);

    const networkFailure = passwordSignInErrorPresentation({
      ok: false,
      error: "Could not reach the server. Check your connection and try again.",
    });
    expect(networkFailure.visible).toBe(true);
    expect(["form", "field"]).toContain(networkFailure.scope);
    expect(networkFailure.message).toBe(
      "Could not reach the server. Check your connection and try again.",
    );
    expect(networkFailure.tokens.text).toBe(DANGER_TEXT_TOKEN);
    expect(networkFailure.tokens.soft).toBe(DANGER_SOFT_TOKEN);
    expect(networkFailure.tokens.border).toBe(DANGER_BORDER_TOKEN);
  });
});


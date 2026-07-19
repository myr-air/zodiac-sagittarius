import { describe, expect, it, vi } from "vitest";
import {
  ACCOUNT_SESSION_STORAGE_KEY,
  SIGN_IN_CODE_ACTION_LABEL,
  emailCodeErrorPresentation,
  finishEmailChallenge,
  loadAccountSession,
  selectSignInMethodPanel,
  startEmailChallenge,
  type StorageLike,
} from "./email-challenge";

/** Independent DESIGN.md danger token names (not read from the helper under test). */
const DANGER_TEXT_TOKEN = "--color-danger";
const DANGER_SOFT_TOKEN = "--color-danger-soft";
const DANGER_BORDER_TOKEN = "--color-danger-border";

const CHALLENGE_ID = "018f4e80-0000-7000-a000-0000000000aa";
const EXPIRES_AT = "2026-07-19T00:15:00Z";
const USER_ID = "018f4e80-0000-7000-a000-000000000001";
const SESSION_TOKEN = "account-session-token-email-xyz";

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

describe("email sign-in code panel", () => {
  it('switches to the email-code panel when choosing "Use sign-in code instead"', () => {
    expect(SIGN_IN_CODE_ACTION_LABEL).toBe("Use sign-in code instead");
    expect(selectSignInMethodPanel("password")).toBe("password");
    expect(selectSignInMethodPanel("email-code")).toBe("email-code");
    expect(selectSignInMethodPanel("use-sign-in-code")).toBe("email-code");
  });
});

describe("startEmailChallenge", () => {
  it("posts { email } to email challenges and returns challengeId for the UI", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      jsonResponse({
        challengeId: CHALLENGE_ID,
        expiresAt: EXPIRES_AT,
      }),
    );

    const outcome = await startEmailChallenge(
      { email: "traveler@example.com" },
      {
        fetch: fetchMock,
        apiBaseUrl: "http://127.0.0.1:5181",
      },
    );

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) throw new Error("expected success");
    expect(outcome.challengeId).toBe(CHALLENGE_ID);
    expect(outcome.expiresAt).toBe(EXPIRES_AT);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("http://127.0.0.1:5181/api/v1/auth/email/challenges");
    expect(init?.method).toBe("POST");
    expect(init?.body).toBe(
      JSON.stringify({ email: "traveler@example.com" }),
    );

    const headers = new Headers(init?.headers);
    expect(headers.get("Content-Type")).toMatch(/application\/json/i);
  });
});

describe("finishEmailChallenge", () => {
  it("posts challenge finish body, stores account session, and navigates to /portal", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      jsonResponse(ACCOUNT_SESSION_BODY),
    );
    const storage = memoryStorage();
    const navigate = vi.fn();

    const outcome = await finishEmailChallenge(
      {
        challengeId: CHALLENGE_ID,
        code: "482913",
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
    expect(url).toBe("http://127.0.0.1:5181/api/v1/auth/email/sessions");
    expect(init?.method).toBe("POST");
    expect(init?.body).toBe(
      JSON.stringify({
        challengeId: CHALLENGE_ID,
        code: "482913",
        trustDevice: false,
        deviceLabel: "Joii web",
      }),
    );

    const headers = new Headers(init?.headers);
    expect(headers.get("Content-Type")).toMatch(/application\/json/i);

    expect(loadAccountSession(storage)?.sessionToken).toBe(SESSION_TOKEN);
    expect(storage.data[ACCOUNT_SESSION_STORAGE_KEY]).toBeTruthy();
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith("/portal");
  });

  it("surfaces a bad verification code as a visible inline danger error", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      jsonResponse(
        {
          error: {
            code: "invalid_credentials",
            message: "That code is incorrect or expired.",
          },
        },
        401,
      ),
    );
    const storage = memoryStorage();
    const navigate = vi.fn();

    const outcome = await finishEmailChallenge(
      {
        challengeId: CHALLENGE_ID,
        code: "000000",
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

    expect(outcome.ok).toBe(false);
    if (outcome.ok) throw new Error("expected failure");
    expect(navigate).not.toHaveBeenCalled();
    expect(loadAccountSession(storage)).toBeNull();

    const presentation = emailCodeErrorPresentation(outcome);
    expect(presentation.visible).toBe(true);
    expect(["form", "field"]).toContain(presentation.scope);
    expect(presentation.message).toBe("That code is incorrect or expired.");
    expect(presentation.tokens.text).toBe(DANGER_TEXT_TOKEN);
    expect(presentation.tokens.soft).toBe(DANGER_SOFT_TOKEN);
    expect(presentation.tokens.border).toBe(DANGER_BORDER_TOKEN);
  });
});

import { describe, expect, it, vi } from "vitest";
import {
  ACCOUNT_SESSION_STORAGE_KEY,
  PASSKEY_ACTION_LABEL,
  loadAccountSession,
  passkeyLoginErrorPresentation,
  signInWithPasskey,
  type StorageLike,
  type WebAuthnCredentialsLike,
} from "./passkey-login";

/** Independent DESIGN.md danger token names (not read from the helper under test). */
const DANGER_TEXT_TOKEN = "--color-danger";
const DANGER_SOFT_TOKEN = "--color-danger-soft";
const DANGER_BORDER_TOKEN = "--color-danger-border";

const CHALLENGE_ID = "018f4e80-0000-7000-a000-0000000000bb";
/** Valid base64url challenge token (independent fixture, not derived by the helper). */
const CHALLENGE = "Y2hhbGxlbmdlLXRva2Vu";
const EXPIRES_AT = "2026-07-19T00:15:00Z";
const CREDENTIAL_ID = "Y3JlZGVudGlhbC1pZA";
const CLIENT_DATA_JSON = "client-data-json-bytes";
const AUTHENTICATOR_DATA = "authenticator-data-bytes";
const SIGNATURE = "signature-bytes";
const USER_ID = "018f4e80-0000-7000-a000-000000000001";
const SESSION_TOKEN = "account-session-token-passkey-xyz";

/** Only these auth passkey endpoints are allowed — no invented routes. */
const ALLOWED_PASSKEY_PATHS = [
  "/api/v1/auth/passkeys/options",
  "/api/v1/auth/passkeys/sessions",
];

const OPTIONS_BODY = {
  challengeId: CHALLENGE_ID,
  challenge: CHALLENGE,
  expiresAt: EXPIRES_AT,
  allowCredentials: [{ credentialId: CREDENTIAL_ID }],
};

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

function utf8Buffer(value: string): ArrayBuffer {
  return new TextEncoder().encode(value).buffer;
}

function mockCredentials(overrides?: {
  get?: WebAuthnCredentialsLike["get"];
}): WebAuthnCredentialsLike {
  return {
    get:
      overrides?.get ??
      (async () => ({
        id: CREDENTIAL_ID,
        rawId: utf8Buffer(CREDENTIAL_ID),
        type: "public-key",
        response: {
          clientDataJSON: utf8Buffer(CLIENT_DATA_JSON),
          authenticatorData: utf8Buffer(AUTHENTICATOR_DATA),
          signature: utf8Buffer(SIGNATURE),
          userHandle: null,
        },
      })),
  };
}

describe("passkey action label", () => {
  it('exposes "Use a passkey" for the secondary login control', () => {
    expect(PASSKEY_ACTION_LABEL).toBe("Use a passkey");
  });
});

describe("signInWithPasskey", () => {
  it("posts options, runs WebAuthn assertion, finishes sessions, stores account session, and navigates to /trips", async () => {
    const fetchMock = vi.fn<typeof fetch>(async (input) => {
      const url = String(input);
      if (url.endsWith("/api/v1/auth/passkeys/options")) {
        return jsonResponse(OPTIONS_BODY);
      }
      if (url.endsWith("/api/v1/auth/passkeys/sessions")) {
        return jsonResponse(ACCOUNT_SESSION_BODY);
      }
      throw new Error(`unexpected url: ${url}`);
    });
    const getAssertion = vi.fn<WebAuthnCredentialsLike["get"]>(async () => ({
      id: CREDENTIAL_ID,
      rawId: utf8Buffer(CREDENTIAL_ID),
      type: "public-key",
      response: {
        clientDataJSON: utf8Buffer(CLIENT_DATA_JSON),
        authenticatorData: utf8Buffer(AUTHENTICATOR_DATA),
        signature: utf8Buffer(SIGNATURE),
        userHandle: null,
      },
    }));
    const credentials = mockCredentials({ get: getAssertion });
    const storage = memoryStorage();
    const navigate = vi.fn();

    const outcome = await signInWithPasskey(
      {
        email: "traveler@example.com",
        trustDevice: false,
        deviceLabel: "Joii web",
      },
      {
        fetch: fetchMock,
        apiBaseUrl: "http://127.0.0.1:5181",
        storage,
        navigate,
        credentials,
      },
    );

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) throw new Error("expected success");

    expect(fetchMock).toHaveBeenCalledTimes(2);

    const [optionsUrl, optionsInit] = fetchMock.mock.calls[0]!;
    expect(optionsUrl).toBe("http://127.0.0.1:5181/api/v1/auth/passkeys/options");
    expect(optionsInit?.method).toBe("POST");
    expect(optionsInit?.body).toBe(
      JSON.stringify({ email: "traveler@example.com" }),
    );
    expect(new Headers(optionsInit?.headers).get("Content-Type")).toMatch(
      /application\/json/i,
    );

    expect(getAssertion).toHaveBeenCalledTimes(1);
    const assertionArg = getAssertion.mock.calls[0]![0];
    expect(assertionArg?.publicKey?.challenge).toBeInstanceOf(ArrayBuffer);
    expect(assertionArg?.publicKey?.allowCredentials).toEqual([
      {
        type: "public-key",
        id: expect.any(ArrayBuffer),
      },
    ]);

    const [sessionsUrl, sessionsInit] = fetchMock.mock.calls[1]!;
    expect(sessionsUrl).toBe(
      "http://127.0.0.1:5181/api/v1/auth/passkeys/sessions",
    );
    expect(sessionsInit?.method).toBe("POST");
    const sessionsBody = JSON.parse(String(sessionsInit?.body)) as Record<
      string,
      unknown
    >;
    expect(sessionsBody.challengeId).toBe(CHALLENGE_ID);
    expect(sessionsBody.trustDevice).toBe(false);
    expect(sessionsBody.deviceLabel).toBe("Joii web");
    expect(typeof sessionsBody.credentialId).toBe("string");
    expect(typeof sessionsBody.clientDataJson).toBe("string");
    expect(typeof sessionsBody.authenticatorData).toBe("string");
    expect(typeof sessionsBody.signature).toBe("string");

    expect(loadAccountSession(storage)?.sessionToken).toBe(SESSION_TOKEN);
    expect(storage.data[ACCOUNT_SESSION_STORAGE_KEY]).toBeTruthy();
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith("/trips");

    for (const [url] of fetchMock.mock.calls) {
      const path = new URL(String(url)).pathname;
      expect(ALLOWED_PASSKEY_PATHS).toContain(path);
    }
  });
});

describe("signInWithPasskey failures", () => {
  it("surfaces missing WebAuthn support as a visible inline danger error without calling the API", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    const storage = memoryStorage();
    const navigate = vi.fn();

    const outcome = await signInWithPasskey(
      {
        email: "traveler@example.com",
        trustDevice: false,
        deviceLabel: "Joii web",
      },
      {
        fetch: fetchMock,
        apiBaseUrl: "http://127.0.0.1:5181",
        storage,
        navigate,
        credentials: null,
      },
    );

    expect(outcome.ok).toBe(false);
    if (outcome.ok) throw new Error("expected failure");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    expect(loadAccountSession(storage)).toBeNull();

    const presentation = passkeyLoginErrorPresentation(outcome);
    expect(presentation.visible).toBe(true);
    expect(["form", "field"]).toContain(presentation.scope);
    expect(presentation.message.length).toBeGreaterThan(0);
    expect(presentation.tokens.text).toBe(DANGER_TEXT_TOKEN);
    expect(presentation.tokens.soft).toBe(DANGER_SOFT_TOKEN);
    expect(presentation.tokens.border).toBe(DANGER_BORDER_TOKEN);
  });

  it("surfaces options API failure as a visible inline danger error without inventing endpoints", async () => {
    const fetchMock = vi.fn<typeof fetch>(async (input) => {
      const url = String(input);
      expect(url).toBe("http://127.0.0.1:5181/api/v1/auth/passkeys/options");
      return jsonResponse(
        {
          error: {
            code: "unauthenticated",
            message: "No passkey is registered for this email.",
          },
        },
        401,
      );
    });
    const getAssertion = vi.fn<WebAuthnCredentialsLike["get"]>();
    const storage = memoryStorage();
    const navigate = vi.fn();

    const outcome = await signInWithPasskey(
      {
        email: "traveler@example.com",
        trustDevice: false,
        deviceLabel: "Joii web",
      },
      {
        fetch: fetchMock,
        apiBaseUrl: "http://127.0.0.1:5181",
        storage,
        navigate,
        credentials: mockCredentials({ get: getAssertion }),
      },
    );

    expect(outcome.ok).toBe(false);
    if (outcome.ok) throw new Error("expected failure");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getAssertion).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    expect(loadAccountSession(storage)).toBeNull();

    for (const [url] of fetchMock.mock.calls) {
      const path = new URL(String(url)).pathname;
      expect(ALLOWED_PASSKEY_PATHS).toContain(path);
    }

    const presentation = passkeyLoginErrorPresentation(outcome);
    expect(presentation.visible).toBe(true);
    expect(["form", "field"]).toContain(presentation.scope);
    expect(presentation.message).toBe(
      "No passkey is registered for this email.",
    );
    expect(presentation.tokens.text).toBe(DANGER_TEXT_TOKEN);
    expect(presentation.tokens.soft).toBe(DANGER_SOFT_TOKEN);
    expect(presentation.tokens.border).toBe(DANGER_BORDER_TOKEN);
  });

  it("surfaces WebAuthn assertion failure as a visible inline danger error without inventing endpoints", async () => {
    const fetchMock = vi.fn<typeof fetch>(async (input) => {
      const url = String(input);
      if (url.endsWith("/api/v1/auth/passkeys/options")) {
        return jsonResponse(OPTIONS_BODY);
      }
      throw new Error(`unexpected url: ${url}`);
    });
    const getAssertion = vi.fn<WebAuthnCredentialsLike["get"]>(async () => {
      throw new DOMException("The operation either timed out or was not allowed.", "NotAllowedError");
    });
    const storage = memoryStorage();
    const navigate = vi.fn();

    const outcome = await signInWithPasskey(
      {
        email: "traveler@example.com",
        trustDevice: false,
        deviceLabel: "Joii web",
      },
      {
        fetch: fetchMock,
        apiBaseUrl: "http://127.0.0.1:5181",
        storage,
        navigate,
        credentials: mockCredentials({ get: getAssertion }),
      },
    );

    expect(outcome.ok).toBe(false);
    if (outcome.ok) throw new Error("expected failure");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getAssertion).toHaveBeenCalledTimes(1);
    expect(navigate).not.toHaveBeenCalled();
    expect(loadAccountSession(storage)).toBeNull();

    for (const [url] of fetchMock.mock.calls) {
      const path = new URL(String(url)).pathname;
      expect(ALLOWED_PASSKEY_PATHS).toContain(path);
    }

    const presentation = passkeyLoginErrorPresentation(outcome);
    expect(presentation.visible).toBe(true);
    expect(["form", "field"]).toContain(presentation.scope);
    expect(presentation.message.length).toBeGreaterThan(0);
    expect(presentation.tokens.text).toBe(DANGER_TEXT_TOKEN);
    expect(presentation.tokens.soft).toBe(DANGER_SOFT_TOKEN);
    expect(presentation.tokens.border).toBe(DANGER_BORDER_TOKEN);
  });
});

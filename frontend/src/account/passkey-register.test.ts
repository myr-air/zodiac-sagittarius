import { describe, expect, it, vi } from "vitest";
import {
  registerPasskey,
  type WebAuthnCredentialsCreateLike,
} from "./passkey-register";

const SESSION_TOKEN = "account-session-token-xyz";
const API_BASE = "http://127.0.0.1:5181";
const CHALLENGE_ID = "018f4e80-0000-7000-a000-0000000000cc";
/** Valid base64url challenge token (independent fixture). */
const CHALLENGE = "cmVnaXN0ZXItY2hhbGxlbmdl";
const EXPIRES_AT = "2026-07-19T00:15:00Z";
const CREDENTIAL_ID = "cmVnaXN0ZXItY3JlZGVudGlhbA";
const CLIENT_DATA_JSON = "client-data-json-create-bytes";
const ATTESTATION_OBJECT = "attestation-object-bytes";
const PASSKEY_ID = "018f4e80-0000-7000-a000-0000000000dd";
const NICKNAME = "Aom MacBook";
const CREATED_AT = "2026-07-19T00:00:00Z";

/** Only these account passkey endpoints are allowed — no invented routes. */
const ALLOWED_PASSKEY_PATHS = [
  "/api/v1/account/passkeys/options",
  "/api/v1/account/passkeys",
];

const OPTIONS_BODY = {
  challengeId: CHALLENGE_ID,
  challenge: CHALLENGE,
  expiresAt: EXPIRES_AT,
};

const PASSKEY_SUMMARY_BODY = {
  id: PASSKEY_ID,
  nickname: NICKNAME,
  createdAt: CREATED_AT,
  lastUsedAt: null,
};

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
  create?: WebAuthnCredentialsCreateLike["create"];
}): WebAuthnCredentialsCreateLike {
  return {
    create:
      overrides?.create ??
      (async () => ({
        id: CREDENTIAL_ID,
        rawId: utf8Buffer(CREDENTIAL_ID),
        type: "public-key",
        response: {
          clientDataJSON: utf8Buffer(CLIENT_DATA_JSON),
          attestationObject: utf8Buffer(ATTESTATION_OBJECT),
        },
      })),
  };
}

describe("registerPasskey", () => {
  it("posts /account/passkeys/options, runs injectable WebAuthn create, then posts /account/passkeys", async () => {
    const fetchMock = vi.fn<typeof fetch>(async (input) => {
      const url = String(input);
      if (url.endsWith("/api/v1/account/passkeys/options")) {
        return jsonResponse(OPTIONS_BODY);
      }
      if (url.endsWith("/api/v1/account/passkeys")) {
        return jsonResponse(PASSKEY_SUMMARY_BODY);
      }
      throw new Error(`unexpected url: ${url}`);
    });
    const createCredential = vi.fn<WebAuthnCredentialsCreateLike["create"]>(
      async () => ({
        id: CREDENTIAL_ID,
        rawId: utf8Buffer(CREDENTIAL_ID),
        type: "public-key",
        response: {
          clientDataJSON: utf8Buffer(CLIENT_DATA_JSON),
          attestationObject: utf8Buffer(ATTESTATION_OBJECT),
        },
      }),
    );
    const credentials = mockCredentials({ create: createCredential });

    const outcome = await registerPasskey(
      { sessionToken: SESSION_TOKEN, nickname: NICKNAME },
      {
        fetch: fetchMock,
        apiBaseUrl: API_BASE,
        credentials,
      },
    );

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) throw new Error("expected success");

    expect(fetchMock).toHaveBeenCalledTimes(2);

    const [optionsUrl, optionsInit] = fetchMock.mock.calls[0]!;
    expect(optionsUrl).toBe(`${API_BASE}/api/v1/account/passkeys/options`);
    expect(optionsInit?.method).toBe("POST");
    expect(new Headers(optionsInit?.headers).get("Authorization")).toBe(
      `Bearer ${SESSION_TOKEN}`,
    );

    expect(createCredential).toHaveBeenCalledTimes(1);
    const createArg = createCredential.mock.calls[0]![0];
    expect(createArg?.publicKey?.challenge).toBeInstanceOf(ArrayBuffer);

    const [finishUrl, finishInit] = fetchMock.mock.calls[1]!;
    expect(finishUrl).toBe(`${API_BASE}/api/v1/account/passkeys`);
    expect(finishInit?.method).toBe("POST");
    expect(new Headers(finishInit?.headers).get("Authorization")).toBe(
      `Bearer ${SESSION_TOKEN}`,
    );
    expect(new Headers(finishInit?.headers).get("Content-Type")).toMatch(
      /application\/json/i,
    );

    const finishBody = JSON.parse(String(finishInit?.body)) as Record<
      string,
      unknown
    >;
    expect(finishBody.challengeId).toBe(CHALLENGE_ID);
    expect(finishBody.nickname).toBe(NICKNAME);
    expect(typeof finishBody.credentialId).toBe("string");
    expect(typeof finishBody.clientDataJson).toBe("string");
    expect(typeof finishBody.attestationObject).toBe("string");

    // Independent literals from the 200 PasskeySummary body.
    expect(outcome.passkey).toEqual({
      id: PASSKEY_ID,
      nickname: NICKNAME,
      createdAt: CREATED_AT,
      lastUsedAt: null,
    });

    for (const [url] of fetchMock.mock.calls) {
      const path = new URL(String(url)).pathname;
      expect(ALLOWED_PASSKEY_PATHS).toContain(path);
    }
  });
});

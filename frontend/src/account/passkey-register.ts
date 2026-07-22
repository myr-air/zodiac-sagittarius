/**
 * Account passkey registration — POST /account/passkeys/options, WebAuthn
 * create (injectable), then POST /account/passkeys. Mirrors passkey-login.
 */

import type { PasskeySummary } from "./account-api";

/** Minimal WebAuthn credentials.create surface — injectable for tests. */
export type WebAuthnAttestationCredential = {
  id: string;
  rawId: ArrayBuffer;
  type: string;
  response: {
    clientDataJSON: ArrayBuffer;
    attestationObject: ArrayBuffer;
  };
};

/** Injectable create options — only challenge is required for our registration flow. */
export type WebAuthnCreateOptions = {
  publicKey?: {
    challenge: BufferSource;
  };
};

export type WebAuthnCredentialsCreateLike = {
  create: (
    options?: WebAuthnCreateOptions,
  ) => Promise<WebAuthnAttestationCredential | null>;
};

export type RegisterPasskeyInput = {
  sessionToken: string;
  nickname: string;
};

export type RegisterPasskeyDeps = {
  fetch: typeof fetch;
  apiBaseUrl: string;
  /** Injected WebAuthn credentials API; omit or null when unsupported. */
  credentials?: WebAuthnCredentialsCreateLike | null;
};

export type RegisterPasskeySuccess = {
  ok: true;
  passkey: PasskeySummary;
};

export type RegisterPasskeyFailure = {
  ok: false;
  error: string;
};

export type RegisterPasskeyOutcome =
  | RegisterPasskeySuccess
  | RegisterPasskeyFailure;

type PasskeyOptionsBody = {
  challengeId?: unknown;
  challenge?: unknown;
  expiresAt?: unknown;
  error?: { code?: unknown; message?: unknown };
};

type PasskeySummaryBody = {
  id?: unknown;
  nickname?: unknown;
  createdAt?: unknown;
  lastUsedAt?: unknown;
  error?: { code?: unknown; message?: unknown };
};

function passkeyOptionsUrl(apiBaseUrl: string): string {
  const base = apiBaseUrl.replace(/\/+$/, "");
  return `${base}/api/v1/account/passkeys/options`;
}

function passkeysUrl(apiBaseUrl: string): string {
  const base = apiBaseUrl.replace(/\/+$/, "");
  return `${base}/api/v1/account/passkeys`;
}

function optionsFailureMessage(
  body: PasskeyOptionsBody | null,
  status: number,
): string {
  const fromApi =
    body && typeof body.error?.message === "string"
      ? body.error.message.trim()
      : "";
  if (fromApi) return fromApi;
  if (status >= 500) {
    return "Something went wrong starting passkey registration. Please try again.";
  }
  return "Could not start passkey registration. Please try again.";
}

function finishFailureMessage(
  body: PasskeySummaryBody | null,
  status: number,
): string {
  const fromApi =
    body && typeof body.error?.message === "string"
      ? body.error.message.trim()
      : "";
  if (fromApi) return fromApi;
  if (status >= 500) {
    return "Something went wrong registering the passkey. Please try again.";
  }
  return "Passkey registration failed. Please try again.";
}

function base64UrlToBuffer(value: string): ArrayBuffer {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (padded.length % 4)) % 4;
  const binary = atob(padded + "=".repeat(padLength));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function resolveCredentials(
  credentials: WebAuthnCredentialsCreateLike | null | undefined,
): WebAuthnCredentialsCreateLike | null {
  if (credentials === null) return null;
  if (credentials) return credentials;
  if (
    typeof globalThis.navigator !== "undefined" &&
    globalThis.navigator.credentials &&
    typeof globalThis.navigator.credentials.create === "function"
  ) {
    return globalThis.navigator
      .credentials as unknown as WebAuthnCredentialsCreateLike;
  }
  return null;
}

function optionalString(value: unknown): string | null | undefined {
  if (value == null) return null;
  if (typeof value === "string") return value;
  return undefined;
}

function parsePasskeySummary(body: PasskeySummaryBody | null): PasskeySummary | null {
  if (!body) return null;
  if (typeof body.id !== "string") return null;
  if (typeof body.nickname !== "string") return null;
  if (typeof body.createdAt !== "string") return null;
  const lastUsedAt = optionalString(body.lastUsedAt);
  if (lastUsedAt === undefined) return null;
  return {
    id: body.id,
    nickname: body.nickname,
    createdAt: body.createdAt,
    lastUsedAt,
  };
}

/**
 * POST registration options, run injectable WebAuthn create, finish registration.
 * On success returns the PasskeySummary from the finish response.
 */
export async function registerPasskey(
  input: RegisterPasskeyInput,
  deps: RegisterPasskeyDeps,
): Promise<RegisterPasskeyOutcome> {
  const credentials = resolveCredentials(deps.credentials);
  if (!credentials) {
    return {
      ok: false,
      error:
        "Passkeys are not supported in this browser. Use another device or browser.",
    };
  }

  let optionsResponse: Response;
  try {
    optionsResponse = await deps.fetch(passkeyOptionsUrl(deps.apiBaseUrl), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.sessionToken}`,
      },
    });
  } catch {
    return {
      ok: false,
      error: "Could not reach the server. Check your connection and try again.",
    };
  }

  let optionsBody: PasskeyOptionsBody | null = null;
  try {
    optionsBody = (await optionsResponse.json()) as PasskeyOptionsBody;
  } catch {
    optionsBody = null;
  }

  if (!optionsResponse.ok) {
    return {
      ok: false,
      error: optionsFailureMessage(optionsBody, optionsResponse.status),
    };
  }

  if (
    !optionsBody ||
    typeof optionsBody.challengeId !== "string" ||
    typeof optionsBody.challenge !== "string" ||
    typeof optionsBody.expiresAt !== "string"
  ) {
    return {
      ok: false,
      error:
        "Passkey registration started but the response was incomplete. Please try again.",
    };
  }

  const challengeId = optionsBody.challengeId;
  const challenge = optionsBody.challenge;

  let attestation: WebAuthnAttestationCredential | null;
  try {
    attestation = await credentials.create({
      publicKey: {
        challenge: base64UrlToBuffer(challenge),
      },
    });
  } catch {
    return {
      ok: false,
      error: "Passkey creation failed or was cancelled. Please try again.",
    };
  }

  if (!attestation) {
    return {
      ok: false,
      error: "Passkey creation failed or was cancelled. Please try again.",
    };
  }

  let finishResponse: Response;
  try {
    finishResponse = await deps.fetch(passkeysUrl(deps.apiBaseUrl), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.sessionToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        challengeId,
        nickname: input.nickname,
        credentialId: bufferToBase64Url(attestation.rawId),
        clientDataJson: bufferToBase64Url(attestation.response.clientDataJSON),
        attestationObject: bufferToBase64Url(
          attestation.response.attestationObject,
        ),
      }),
    });
  } catch {
    return {
      ok: false,
      error: "Could not reach the server. Check your connection and try again.",
    };
  }

  let finishBody: PasskeySummaryBody | null = null;
  try {
    finishBody = (await finishResponse.json()) as PasskeySummaryBody;
  } catch {
    finishBody = null;
  }

  if (!finishResponse.ok) {
    return {
      ok: false,
      error: finishFailureMessage(finishBody, finishResponse.status),
    };
  }

  const passkey = parsePasskeySummary(finishBody);
  if (!passkey) {
    return {
      ok: false,
      error:
        "Passkey registered but the response was incomplete. Please try again.",
    };
  }

  return { ok: true, passkey };
}

import {
  type AccountSessionRecord,
  type StorageLike,
  loadAccountSession,
  saveAccountSession,
  ACCOUNT_SESSION_STORAGE_KEY,
} from "./account-session";

export type { StorageLike, AccountSessionRecord };
export { ACCOUNT_SESSION_STORAGE_KEY, loadAccountSession };

/** Draft v3 secondary-method control label on the password sign-in panel. */
export const PASSKEY_ACTION_LABEL = "Use a passkey";

export type SignInWithPasskeyInput = {
  email: string;
  trustDevice: boolean;
  deviceLabel: string;
};

/** Minimal WebAuthn credentials.get surface — injectable for tests. */
export type WebAuthnAssertionCredential = {
  id: string;
  rawId: ArrayBuffer;
  type: string;
  response: {
    clientDataJSON: ArrayBuffer;
    authenticatorData: ArrayBuffer;
    signature: ArrayBuffer;
    userHandle: ArrayBuffer | null;
  };
};

export type WebAuthnCredentialsLike = {
  get: (
    options?: CredentialRequestOptions,
  ) => Promise<WebAuthnAssertionCredential | null>;
};

export type SignInWithPasskeyDeps = {
  fetch: typeof fetch;
  apiBaseUrl: string;
  storage: StorageLike;
  navigate: (route: string) => void;
  /** Injected WebAuthn credentials API; omit or null when unsupported. */
  credentials?: WebAuthnCredentialsLike | null;
};

export type SignInWithPasskeySuccess = {
  ok: true;
  session: AccountSessionRecord;
};

export type SignInWithPasskeyFailure = {
  ok: false;
  error: string;
};

export type SignInWithPasskeyOutcome =
  | SignInWithPasskeySuccess
  | SignInWithPasskeyFailure;

export type PasskeyLoginErrorPresentation = {
  visible: boolean;
  scope: "form" | "field";
  message: string;
  tokens: {
    text: "--color-danger";
    soft: "--color-danger-soft";
    border: "--color-danger-border";
  };
};

/** Map a failed passkey outcome to visible inline danger error presentation. */
export function passkeyLoginErrorPresentation(
  failure: SignInWithPasskeyFailure,
): PasskeyLoginErrorPresentation {
  return {
    visible: true,
    scope: "form",
    message: failure.error,
    tokens: {
      text: "--color-danger",
      soft: "--color-danger-soft",
      border: "--color-danger-border",
    },
  };
}

type PasskeyOptionsBody = {
  challengeId?: unknown;
  challenge?: unknown;
  expiresAt?: unknown;
  allowCredentials?: unknown;
  error?: { code?: unknown; message?: unknown };
};

type PasskeySessionBody = {
  userId?: unknown;
  sessionToken?: unknown;
  kind?: unknown;
  trustedDeviceId?: unknown;
  createdAt?: unknown;
  expiresAt?: unknown;
  error?: { code?: unknown; message?: unknown };
};

type PasskeyCredentialDescriptor = {
  credentialId: string;
};

type PasskeyLoginOptions = {
  challengeId: string;
  challenge: string;
  expiresAt: string;
  allowCredentials: PasskeyCredentialDescriptor[];
};

/** Default API origin from Next public env (empty = same-origin relative `/api/v1`). */
export function defaultApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL?.trim() ?? "";
}

function passkeyOptionsUrl(apiBaseUrl: string): string {
  const base = apiBaseUrl.replace(/\/+$/, "");
  return `${base}/api/v1/auth/passkeys/options`;
}

function passkeySessionsUrl(apiBaseUrl: string): string {
  const base = apiBaseUrl.replace(/\/+$/, "");
  return `${base}/api/v1/auth/passkeys/sessions`;
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
    return "Something went wrong starting passkey sign-in. Please try again.";
  }
  return "Could not start passkey sign-in. Check your email and try again.";
}

function sessionFailureMessage(
  body: PasskeySessionBody | null,
  status: number,
): string {
  const fromApi =
    body && typeof body.error?.message === "string"
      ? body.error.message.trim()
      : "";
  if (fromApi) return fromApi;
  if (status >= 500) {
    return "Something went wrong verifying the passkey. Please try again.";
  }
  return "Passkey sign-in failed. Please try again.";
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

function parseAllowCredentials(
  value: unknown,
): PasskeyCredentialDescriptor[] | null {
  if (!Array.isArray(value)) return null;
  const descriptors: PasskeyCredentialDescriptor[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") return null;
    const credentialId = (entry as { credentialId?: unknown }).credentialId;
    if (typeof credentialId !== "string") return null;
    descriptors.push({ credentialId });
  }
  return descriptors;
}

function resolveCredentials(
  credentials: WebAuthnCredentialsLike | null | undefined,
): WebAuthnCredentialsLike | null {
  if (credentials === null) return null;
  if (credentials) return credentials;
  if (
    typeof globalThis.navigator !== "undefined" &&
    globalThis.navigator.credentials &&
    typeof globalThis.navigator.credentials.get === "function"
  ) {
    return globalThis.navigator.credentials as unknown as WebAuthnCredentialsLike;
  }
  return null;
}

/**
 * POST email to start passkey options, run WebAuthn assertion, finish sessions.
 * On success stores the account session and navigates to `/portal`.
 */
export async function signInWithPasskey(
  input: SignInWithPasskeyInput,
  deps: SignInWithPasskeyDeps,
): Promise<SignInWithPasskeyOutcome> {
  const credentials = resolveCredentials(deps.credentials);
  if (!credentials) {
    return {
      ok: false,
      error:
        "Passkeys are not supported in this browser. Use password or a sign-in code instead.",
    };
  }

  let optionsResponse: Response;
  try {
    optionsResponse = await deps.fetch(passkeyOptionsUrl(deps.apiBaseUrl), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: input.email }),
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

  const allowCredentials = parseAllowCredentials(
    optionsBody?.allowCredentials,
  );
  if (
    !optionsBody ||
    typeof optionsBody.challengeId !== "string" ||
    typeof optionsBody.challenge !== "string" ||
    typeof optionsBody.expiresAt !== "string" ||
    !allowCredentials
  ) {
    return {
      ok: false,
      error:
        "Passkey sign-in started but the response was incomplete. Please try again.",
    };
  }

  const loginOptions: PasskeyLoginOptions = {
    challengeId: optionsBody.challengeId,
    challenge: optionsBody.challenge,
    expiresAt: optionsBody.expiresAt,
    allowCredentials,
  };

  let assertion: WebAuthnAssertionCredential | null;
  try {
    assertion = await credentials.get({
      publicKey: {
        challenge: base64UrlToBuffer(loginOptions.challenge),
        allowCredentials: loginOptions.allowCredentials.map((descriptor) => ({
          type: "public-key",
          id: base64UrlToBuffer(descriptor.credentialId),
        })),
        userVerification: "preferred",
      },
    });
  } catch {
    return {
      ok: false,
      error: "Passkey assertion failed or was cancelled. Please try again.",
    };
  }

  if (!assertion) {
    return {
      ok: false,
      error: "Passkey assertion failed or was cancelled. Please try again.",
    };
  }

  let sessionResponse: Response;
  try {
    sessionResponse = await deps.fetch(passkeySessionsUrl(deps.apiBaseUrl), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        challengeId: loginOptions.challengeId,
        credentialId: bufferToBase64Url(assertion.rawId),
        clientDataJson: bufferToBase64Url(assertion.response.clientDataJSON),
        authenticatorData: bufferToBase64Url(
          assertion.response.authenticatorData,
        ),
        signature: bufferToBase64Url(assertion.response.signature),
        trustDevice: input.trustDevice,
        deviceLabel: input.deviceLabel,
      }),
    });
  } catch {
    return {
      ok: false,
      error: "Could not reach the server. Check your connection and try again.",
    };
  }

  let sessionBody: PasskeySessionBody | null = null;
  try {
    sessionBody = (await sessionResponse.json()) as PasskeySessionBody;
  } catch {
    sessionBody = null;
  }

  if (!sessionResponse.ok) {
    return {
      ok: false,
      error: sessionFailureMessage(sessionBody, sessionResponse.status),
    };
  }

  if (
    !sessionBody ||
    typeof sessionBody.userId !== "string" ||
    typeof sessionBody.sessionToken !== "string" ||
    (sessionBody.kind !== "temporary" && sessionBody.kind !== "trusted") ||
    !(
      sessionBody.trustedDeviceId === null ||
      typeof sessionBody.trustedDeviceId === "string"
    ) ||
    typeof sessionBody.createdAt !== "string" ||
    typeof sessionBody.expiresAt !== "string"
  ) {
    return {
      ok: false,
      error: "Signed in but the response was incomplete. Please try again.",
    };
  }

  const session: AccountSessionRecord = {
    userId: sessionBody.userId,
    sessionToken: sessionBody.sessionToken,
    kind: sessionBody.kind,
    trustedDeviceId: sessionBody.trustedDeviceId,
    createdAt: sessionBody.createdAt,
    expiresAt: sessionBody.expiresAt,
  };

  saveAccountSession(deps.storage, session);
  deps.navigate("/portal");

  return { ok: true, session };
}

import type {
  AccountSettings,
  AccountSettingsUpdateRequest,
} from "@/src/account/api-client";
import type { Messages } from "@/src/i18n/messages";

export const ACCESS_ERROR_CODES = {
  accountLoadFailed: "account-load-failed",
  apiConnectionFailed: "api-connection-failed",
  passkeyRegistrationCredential: "passkey-registration-credential",
  passkeyLoginCredential: "passkey-login-credential",
  passkeyUnsupported: "passkey-unsupported",
} as const;

export function errorMessage(caught: unknown, fallback: string, labels: Messages["access"]["messages"]): string {
  return localizeAccessError(rawErrorMessage(caught, fallback), labels) ?? fallback;
}

export function passwordLoginErrorMessage(caught: unknown, fallback: string, labels: Messages["access"]["messages"]): string {
  if (isCredentialFailure(caught)) return fallback;
  return errorMessage(caught, fallback, labels);
}

export function rawErrorMessage(caught: unknown, fallback: string): string {
  if (isApiLikeError(caught)) return caught.code || String(caught.status);
  const caughtMessage = errorLikeMessage(caught);
  if (caughtMessage) {
    const normalized = caughtMessage.trim();
    if (isNetworkAccessError(normalized)) return ACCESS_ERROR_CODES.apiConnectionFailed;
    if (normalized) return normalized;
  }
  return fallback;
}

export function localizeAccessError(message: string | null, labels: Messages["access"]["messages"]): string | null {
  if (!message) return null;
  return friendlyErrorText(message, null, labels);
}

export function friendlyErrorText(message: string, fallback: string | null, labels: Messages["access"]["messages"]): string | null {
  const normalized = message.trim();
  if (normalized === ACCESS_ERROR_CODES.accountLoadFailed) return labels.accountLoadFailed;
  if (normalized === ACCESS_ERROR_CODES.apiConnectionFailed) return labels.apiConnectionFailed;
  if (normalized === ACCESS_ERROR_CODES.passkeyRegistrationCredential) return labels.passkeyRegistrationCredential;
  if (normalized === ACCESS_ERROR_CODES.passkeyLoginCredential) return labels.passkeyLoginCredential;
  if (normalized === ACCESS_ERROR_CODES.passkeyUnsupported) return labels.passkeyUnsupported;
  if (normalized === "not_found") return labels.notFound;
  if (normalized === "invalid_request") return labels.unauthorized;
  if (normalized === "email_delivery_failed") return labels.emailDeliveryFailed;
  if (normalized === "request_failed") return labels.serviceUnavailable;
  if (normalized === "404") return labels.notFound;
  if (normalized === "401" || normalized === "403" || normalized === "unauthenticated" || normalized === "unauthorized" || normalized === "forbidden") return labels.unauthorized;
  if (!normalized || /^\d{3}$/.test(normalized)) return fallback;
  return fallback;
}

export function isCredentialFailure(value: unknown): boolean {
  if (!isApiLikeError(value)) return false;
  const code = value.code?.trim();
  return value.status === 401 || value.status === 403 || code === "unauthenticated" || code === "unauthorized" || code === "forbidden";
}

function errorLikeMessage(value: unknown): string | null {
  if (value instanceof Error && value.message) return value.message;
  if (!value || typeof value !== "object" || !("message" in value)) return null;
  const message = (value as { message?: unknown }).message;
  return typeof message === "string" ? message : null;
}

function isNetworkAccessError(message: string): boolean {
  const normalized = message.toLowerCase();
  return normalized === "failed to fetch" ||
    normalized === "load failed" ||
    normalized === "fetch failed" ||
    normalized.includes("networkerror") ||
    normalized.includes("network request failed");
}

export function isApiLikeError(value: unknown): value is { code?: string; status?: number } {
  return Boolean(
    value &&
      typeof value === "object" &&
      ("code" in value || "status" in value) &&
      (typeof (value as { code?: unknown }).code === "string" || typeof (value as { status?: unknown }).status === "number"),
  );
}

export function isUnauthenticated(value: unknown): boolean {
  return isApiLikeError(value) && value.status === 401;
}

export function formatDateTime(value: string, locale: "en" | "th"): string {
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function profileToForm(settings: AccountSettings): AccountSettingsUpdateRequest {
  return {
    displayName: settings.profile.displayName,
    avatarColor: settings.profile.avatarColor,
    locale: settings.profile.locale,
    timezone: settings.profile.timezone,
    homeCity: settings.profile.homeCity ?? "",
    homeCountry: settings.profile.homeCountry ?? "",
  };
}

export async function createPasskeyCredential(challenge: string, settings: AccountSettings) {
  const credentials = assertCredentialApi();
  const userName = settings.profile.primaryEmail ?? settings.profile.displayName;
  const rpId = getPasskeyRpId();
  const credential = await credentials.create({
    publicKey: {
      challenge: base64UrlToArrayBuffer(challenge),
      rp: { name: "Joii", ...(rpId ? { id: rpId } : {}) },
      user: {
        id: new TextEncoder().encode(settings.profile.id),
        name: userName,
        displayName: settings.profile.displayName,
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },
        { type: "public-key", alg: -257 },
      ],
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "required",
      },
      attestation: "none",
      timeout: 60_000,
    },
  });

  if (!isRegistrationCredential(credential)) {
    throw new Error(ACCESS_ERROR_CODES.passkeyRegistrationCredential);
  }

  return credential;
}

export async function getPasskeyCredential(challenge: string, credentialIds: string[]) {
  const credentials = assertCredentialApi();
  const credential = await credentials.get({
    publicKey: {
      challenge: base64UrlToArrayBuffer(challenge),
      allowCredentials: credentialIds.map((credentialId) => ({
        type: "public-key",
        id: base64UrlToArrayBuffer(credentialId),
      })),
      userVerification: "required",
      timeout: 60_000,
    },
  });

  if (!isAssertionCredential(credential)) {
    throw new Error(ACCESS_ERROR_CODES.passkeyLoginCredential);
  }

  return credential;
}

type RegistrationCredential = PublicKeyCredential & {
  response: AuthenticatorAttestationResponse;
};

type AssertionCredential = PublicKeyCredential & {
  response: AuthenticatorAssertionResponse;
};

function assertCredentialApi(): CredentialsContainer {
  if (typeof navigator === "undefined" || !navigator.credentials) {
    throw new Error(ACCESS_ERROR_CODES.passkeyUnsupported);
  }
  return navigator.credentials;
}

function isRegistrationCredential(credential: Credential | null): credential is RegistrationCredential {
  return isPublicKeyCredential(credential) && "attestationObject" in credential.response && credential.response.attestationObject instanceof ArrayBuffer;
}

function isAssertionCredential(credential: Credential | null): credential is AssertionCredential {
  return (
    isPublicKeyCredential(credential) &&
    "authenticatorData" in credential.response &&
    "signature" in credential.response &&
    credential.response.authenticatorData instanceof ArrayBuffer &&
    credential.response.signature instanceof ArrayBuffer
  );
}

function getPasskeyRpId(): string | null {
  const rpHost = window.location.hostname;
  if (!rpHost) return null;
  if (rpHost === "localhost") return rpHost;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(rpHost)) return null;
  if (/^([0-9a-fA-F:]+)$/.test(rpHost)) return null;
  return rpHost;
}

function isPublicKeyCredential(credential: Credential | null): credential is PublicKeyCredential {
  return (
    !!credential &&
    "rawId" in credential &&
    credential.rawId instanceof ArrayBuffer &&
    "response" in credential &&
    typeof credential.response === "object" &&
    credential.response !== null &&
    "clientDataJSON" in credential.response &&
    credential.response.clientDataJSON instanceof ArrayBuffer
  );
}

export function base64UrlToArrayBuffer(value: string): ArrayBuffer {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
}

export function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/u, "");
}

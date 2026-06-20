import type {
  AccountSettings,
  AccountSettingsUpdateRequest,
} from "@/src/account/api-client";
import type { Messages } from "@/src/i18n/messages";
import { ACCESS_ERROR_CODES } from "./account-access-error-codes";

export { ACCESS_ERROR_CODES } from "./account-access-error-codes";
export {
  arrayBufferToBase64Url,
  base64UrlToArrayBuffer,
  buildPasskeyLoginFinishInput,
  createPasskeyCredential,
  getPasskeyCredential,
} from "./account-passkey-support";

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

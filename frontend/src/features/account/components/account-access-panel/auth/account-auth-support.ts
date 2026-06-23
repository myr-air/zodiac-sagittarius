import type {
  AccountSettings,
  AccountSettingsUpdateRequest,
} from "@/src/account/api-client";
import {
  displayDateTimeLocaleCode,
  formatDisplayDateTime,
} from "@/src/shared/date-time-display";

export { ACCESS_ERROR_CODES } from "./account-access-error-codes";
export {
  errorMessage,
  friendlyErrorText,
  isApiLikeError,
  isCredentialFailure,
  isUnauthenticated,
  localizeAccessError,
  passwordLoginErrorMessage,
  rawErrorMessage,
} from "./account-auth-errors";
export {
  arrayBufferToBase64Url,
  base64UrlToArrayBuffer,
  buildPasskeyLoginFinishInput,
  createPasskeyCredential,
  getPasskeyCredential,
} from "./account-passkey-support";

export function formatDateTime(value: string, locale: "en" | "th"): string {
  return formatDisplayDateTime(value, displayDateTimeLocaleCode(locale), {
    dateStyle: "medium",
    timeStyle: "short",
  });
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

/**
 * Account settings form — Profile + Locale & hometown field bindings (draft-v2).
 *
 * Country is read-only/derived from hometown suggestion; clearing city clears country.
 */

import type { AccountProfile } from "./account-api";

/** draft-v2 avatar color swatches. */
export const ACCOUNT_AVATAR_SWATCHES = [
  "#0f766e",
  "#2563eb",
  "#7c3aed",
  "#c2410c",
  "#be123c",
  "#334155",
] as const;

export type AccountSettingsForm = {
  displayName: string;
  avatarColor: string;
  locale: string;
  timezone: string;
  homeCity: string;
  homeCountry: string;
};

export type HometownSuggestion = {
  city: string;
  country: string;
};

function nullableToString(value: string | null): string {
  return value ?? "";
}

/** Map GET /account profile into editable form fields. */
export function accountSettingsFormFromProfile(
  profile: AccountProfile,
): AccountSettingsForm {
  return {
    displayName: profile.displayName,
    avatarColor: profile.avatarColor,
    locale: profile.locale,
    timezone: profile.timezone,
    homeCity: nullableToString(profile.homeCity),
    homeCountry: nullableToString(profile.homeCountry),
  };
}

/** Apply a hometown suggestion — city + derived country. */
export function applyHometownSuggestion(
  form: AccountSettingsForm,
  suggestion: HometownSuggestion,
): AccountSettingsForm {
  return {
    ...form,
    homeCity: suggestion.city,
    homeCountry: suggestion.country,
  };
}

/**
 * Update home city. Clearing the city also clears the derived country.
 */
export function changeHomeCity(
  form: AccountSettingsForm,
  homeCity: string,
): AccountSettingsForm {
  return {
    ...form,
    homeCity,
    homeCountry: homeCity === "" ? "" : form.homeCountry,
  };
}

/** True when any editable field differs from the saved baseline. */
export function isAccountSettingsFormDirty(
  form: AccountSettingsForm,
  baseline: AccountSettingsForm,
): boolean {
  return (
    form.displayName !== baseline.displayName ||
    form.avatarColor !== baseline.avatarColor ||
    form.locale !== baseline.locale ||
    form.timezone !== baseline.timezone ||
    form.homeCity !== baseline.homeCity ||
    form.homeCountry !== baseline.homeCountry
  );
}

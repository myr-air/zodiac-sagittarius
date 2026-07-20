/**
 * account-settings-form — Profile + Locale & hometown field bindings (draft-v2).
 *
 * Country is read-only/derived from hometown suggestion; clearing city clears country.
 */
import { describe, expect, it } from "vitest";
import {
  ACCOUNT_AVATAR_SWATCHES,
  accountSettingsFormFromProfile,
  applyHometownSuggestion,
  changeHomeCity,
} from "./account-settings-form";
import type { AccountProfile } from "./account-api";

/** Independent literals from draft-v2 Profile / Locale & hometown + AccountSettings body. */
const DISPLAY_NAME = "Aom";
const AVATAR_COLOR = "#0f766e";
const LOCALE = "th-TH";
const TIMEZONE = "Asia/Bangkok";
const HOME_CITY = "Bangkok";
const HOME_COUNTRY = "Thailand";

/** draft-v2 swatch palette (independent of production export). */
const DRAFT_AVATAR_SWATCHES = [
  "#0f766e",
  "#2563eb",
  "#7c3aed",
  "#c2410c",
  "#be123c",
  "#334155",
] as const;

const SUGGESTION_CITY = "Chiang Mai";
const SUGGESTION_COUNTRY = "Thailand";

const PROFILE: AccountProfile = {
  displayName: DISPLAY_NAME,
  avatarColor: AVATAR_COLOR,
  locale: LOCALE,
  timezone: TIMEZONE,
  homeCity: HOME_CITY,
  homeCountry: HOME_COUNTRY,
  primaryEmail: "aom@joii.app",
};

describe("accountSettingsForm bindings", () => {
  it("Profile binds displayName + avatarColor swatches; Locale & hometown binds locale, timezone, homeCity, homeCountry (country derived from suggestion; clear city clears country)", () => {
    const form = accountSettingsFormFromProfile(PROFILE);

    expect(form).toEqual({
      displayName: DISPLAY_NAME,
      avatarColor: AVATAR_COLOR,
      locale: LOCALE,
      timezone: TIMEZONE,
      homeCity: HOME_CITY,
      homeCountry: HOME_COUNTRY,
    });

    expect(ACCOUNT_AVATAR_SWATCHES).toEqual([...DRAFT_AVATAR_SWATCHES]);
    expect(ACCOUNT_AVATAR_SWATCHES).toContain(form.avatarColor);

    const fromSuggestion = applyHometownSuggestion(form, {
      city: SUGGESTION_CITY,
      country: SUGGESTION_COUNTRY,
    });
    expect(fromSuggestion.homeCity).toBe(SUGGESTION_CITY);
    expect(fromSuggestion.homeCountry).toBe(SUGGESTION_COUNTRY);
    // Country stays derived — other profile/locale fields untouched.
    expect(fromSuggestion.displayName).toBe(DISPLAY_NAME);
    expect(fromSuggestion.avatarColor).toBe(AVATAR_COLOR);
    expect(fromSuggestion.locale).toBe(LOCALE);
    expect(fromSuggestion.timezone).toBe(TIMEZONE);

    const clearedCity = changeHomeCity(fromSuggestion, "");
    expect(clearedCity.homeCity).toBe("");
    expect(clearedCity.homeCountry).toBe("");
  });
});

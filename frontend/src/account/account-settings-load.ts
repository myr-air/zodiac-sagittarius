/**
 * loadAccountSettings — GET /account → identity strip view-model (draft-v2).
 */

import { fetchAccountSettings } from "./account-api";

export type LoadAccountSettingsDeps = {
  fetch: typeof fetch;
  apiBaseUrl: string;
};

export type LoadAccountSettingsInput = {
  sessionToken: string;
};

export type AccountSettingsIdentity = {
  displayName: string;
  primaryEmail: string;
  avatarColor: string;
  initials: string;
};

export type LoadAccountSettingsSuccess = {
  ok: true;
  identity: AccountSettingsIdentity;
};

export type LoadAccountSettingsFailure = {
  ok: false;
  error: string;
};

export type LoadAccountSettingsOutcome =
  | LoadAccountSettingsSuccess
  | LoadAccountSettingsFailure;

/** Initials for the identity avatar — matches draft-v2. */
export function accountDisplayInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

/**
 * Fetch GET /account and map profile fields to the identity strip view-model.
 */
export async function loadAccountSettings(
  input: LoadAccountSettingsInput,
  deps: LoadAccountSettingsDeps,
): Promise<LoadAccountSettingsOutcome> {
  const outcome = await fetchAccountSettings(input, deps);
  if (!outcome.ok) {
    return { ok: false, error: outcome.error };
  }

  const { displayName, avatarColor, primaryEmail } = outcome.profile;
  return {
    ok: true,
    identity: {
      displayName,
      primaryEmail: primaryEmail ?? "",
      avatarColor,
      initials: accountDisplayInitials(displayName),
    },
  };
}

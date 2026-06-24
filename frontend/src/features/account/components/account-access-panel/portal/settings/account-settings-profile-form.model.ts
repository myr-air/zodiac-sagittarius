import type {
  AccountSettings,
  AccountSettingsUpdateRequest,
} from "@/src/account/api-client";
import type { SelectOption } from "@/src/shared/select-options";
import {
  buildAccountPortalProfileDisplay,
  type AccountPortalProfileDisplay,
} from "../profile/account-portal-profile-display";

export type AccountSettingsProfilePreview = AccountPortalProfileDisplay;
export type AccountSettingsLocaleSelectOption = SelectOption;

export const accountSettingsLocaleSelectOptions: readonly AccountSettingsLocaleSelectOption[] = [
  { value: "th-TH", label: "Thai" },
  { value: "en-US", label: "English" },
];

export function accountSettingsProfileToForm(settings: AccountSettings): AccountSettingsUpdateRequest {
  return {
    displayName: settings.profile.displayName,
    avatarColor: settings.profile.avatarColor,
    locale: settings.profile.locale,
    timezone: settings.profile.timezone,
    homeCity: settings.profile.homeCity ?? "",
    homeCountry: settings.profile.homeCountry ?? "",
  };
}

export function accountSettingsProfilePreview(
  form: Pick<AccountSettingsUpdateRequest, "avatarColor" | "displayName">,
  settings: AccountSettings,
  labels: { noEmail: string },
): AccountSettingsProfilePreview {
  return buildAccountPortalProfileDisplay({
    avatarColor: form.avatarColor,
    displayName: form.displayName,
    email: settings.profile.primaryEmail,
    noEmail: labels.noEmail,
  });
}

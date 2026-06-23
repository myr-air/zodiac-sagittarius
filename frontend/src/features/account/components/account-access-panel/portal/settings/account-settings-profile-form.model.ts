import type {
  AccountSettings,
  AccountSettingsUpdateRequest,
} from "@/src/account/api-client";

export interface AccountSettingsLocaleSelectOption {
  value: string;
  label: string;
}

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

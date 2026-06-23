import type {
  AccountSettings,
  AccountSettingsUpdateRequest,
} from "@/src/account/api-client";

export interface AccountSettingsProfilePreview {
  avatarColor: string;
  avatarInitial: string;
  displayName: string;
  email: string;
}

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

export function accountSettingsProfilePreview(
  form: Pick<AccountSettingsUpdateRequest, "avatarColor" | "displayName">,
  settings: AccountSettings,
  labels: { noEmail: string },
): AccountSettingsProfilePreview {
  const displayName = form.displayName;
  return {
    avatarColor: form.avatarColor,
    avatarInitial: displayName.slice(0, 1) || "A",
    displayName,
    email: settings.profile.primaryEmail ?? labels.noEmail,
  };
}

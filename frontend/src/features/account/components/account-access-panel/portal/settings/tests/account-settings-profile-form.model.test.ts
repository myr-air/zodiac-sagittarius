import { describe, expect, it } from "vitest";
import { accountSettings } from "../../../testing/account-access-panel-test-clients";
import { accountSettingsProfileToForm } from "../account-settings-profile-form.model";

describe("account settings profile form model", () => {
  it("maps account profile settings into editable form fields", () => {
    expect(accountSettingsProfileToForm(accountSettings)).toEqual({
      displayName: accountSettings.profile.displayName,
      avatarColor: accountSettings.profile.avatarColor,
      locale: accountSettings.profile.locale,
      timezone: accountSettings.profile.timezone,
      homeCity: accountSettings.profile.homeCity ?? "",
      homeCountry: accountSettings.profile.homeCountry ?? "",
    });
  });

  it("normalizes missing optional home fields to empty strings", () => {
    expect(
      accountSettingsProfileToForm({
        ...accountSettings,
        profile: {
          ...accountSettings.profile,
          homeCity: null,
          homeCountry: null,
        },
      }),
    ).toMatchObject({
      homeCity: "",
      homeCountry: "",
    });
  });
});

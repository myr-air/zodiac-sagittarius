import { describe, expect, it } from "vitest";
import { accountSettings } from "../../../testing/account-access-panel-test-clients";
import {
  accountSettingsLocaleSelectOptions,
  accountSettingsProfilePreview,
  accountSettingsProfileToForm,
} from "../account-settings-profile-form.model";

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

  it("keeps locale select options centralized", () => {
    expect(accountSettingsLocaleSelectOptions).toEqual([
      { value: "th-TH", label: "Thai" },
      { value: "en-US", label: "English" },
    ]);
  });

  it("builds profile preview display values from the editable form", () => {
    expect(
      accountSettingsProfilePreview(
        {
          avatarColor: "#0f766e",
          displayName: "May",
        },
        accountSettings,
        { noEmail: "No email loaded" },
      ),
    ).toEqual({
      avatarColor: "#0f766e",
      avatarInitial: "M",
      displayName: "May",
      email: "aom@example.test",
    });
  });

  it("falls back profile preview initial and email when fields are blank", () => {
    expect(
      accountSettingsProfilePreview(
        {
          avatarColor: "#0f766e",
          displayName: "",
        },
        {
          ...accountSettings,
          profile: {
            ...accountSettings.profile,
            primaryEmail: null,
          },
        },
        { noEmail: "No email loaded" },
      ),
    ).toEqual({
      avatarColor: "#0f766e",
      avatarInitial: "A",
      displayName: "",
      email: "No email loaded",
    });
  });
});

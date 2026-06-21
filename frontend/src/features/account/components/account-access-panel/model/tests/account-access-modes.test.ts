import { describe, expect, it } from "vitest";
import { messages } from "@/src/i18n/messages";
import {
  accountAccessModeValues,
  accountPanelModeValues,
  heroDetail,
  heroTitle,
  isAccountEntryMode,
  mainLabel,
} from "../account-access-modes";

describe("account access modes", () => {
  it("defines access modes in route specificity order", () => {
    expect(accountAccessModeValues).toEqual([
      "combined",
      "account-login",
      "account-register",
      "account-portal",
      "trip-access",
    ]);
  });

  it("defines the account entry panel modes in tab order", () => {
    expect(accountPanelModeValues).toEqual(["account", "temp"]);
  });

  it("routes access modes to the matching hero and landmark copy", () => {
    expect(mainLabel("account-login", messages.en.access.mainLabels)).toBe(messages.en.access.mainLabels.accountLogin);
    expect(heroTitle("account-register", messages.en.access.titles)).toBe(messages.en.access.titles.accountRegister);
    expect(heroDetail("trip-access", messages.en.access.details)).toBe(messages.en.access.details.tripAccess);
    expect(isAccountEntryMode("account-login")).toBe(true);
    expect(isAccountEntryMode("account-portal")).toBe(false);
  });
});

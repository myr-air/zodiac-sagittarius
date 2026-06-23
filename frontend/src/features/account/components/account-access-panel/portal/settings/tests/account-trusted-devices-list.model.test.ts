import { describe, expect, it } from "vitest";
import { messages } from "@/src/i18n/messages";
import { accountSettings } from "../../../testing/account-access-panel-test-clients";
import { trustedDeviceSummary } from "../account-trusted-devices-list.model";

describe("account trusted devices list model", () => {
  it("formats trusted device summaries with the last seen time when available", () => {
    expect(
      trustedDeviceSummary(
        accountSettings.trustedDevices[0],
        messages.en.access.settings,
        "en",
      ),
    ).toContain("Safari");
    expect(
      trustedDeviceSummary(
        accountSettings.trustedDevices[0],
        messages.en.access.settings,
        "en",
      ),
    ).toContain("2026");
  });

  it("falls back to the unknown browser label and created time", () => {
    expect(
      trustedDeviceSummary(
        {
          ...accountSettings.trustedDevices[0],
          userAgent: "",
          createdAt: "2026-06-18T12:30:00.000Z",
          lastSeenAt: null,
        },
        messages.en.access.settings,
        "en",
      ),
    ).toContain(messages.en.access.settings.unknownBrowser);
  });
});

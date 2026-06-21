import { describe, expect, it } from "vitest";
import { enMessages } from "@/src/i18n/messages/en";
import { buildPortalTripWizardSummary } from "../portal-trip-wizard-summary";

const wizard = enMessages.access.dashboard.createTrip.wizard;

describe("buildPortalTripWizardSummary", () => {
  it("summarizes ready trip wizard copy from destinations and completion state", () => {
    expect(
      buildPortalTripWizardSummary({
        accessComplete: true,
        canSubmit: true,
        datesComplete: true,
        destinationComplete: true,
        selectedCountryNames: ["Japan", "China"],
        selectedDestinationNames: ["Tokyo", "Shanghai"],
        tripName: "Summer trip",
        wizard,
      }),
    ).toMatchObject({
      createStatusText: wizard.status.ready,
      currencySummary: "JPY, CNY",
      destinationSummary: "Tokyo, Shanghai",
      inviteStatus: wizard.preview.inviteReady,
      previewTripName: "Summer trip",
    });
  });

  it("falls back to empty copy and names missing fields", () => {
    expect(
      buildPortalTripWizardSummary({
        accessComplete: false,
        canSubmit: false,
        datesComplete: false,
        destinationComplete: false,
        selectedCountryNames: [],
        selectedDestinationNames: [],
        tripName: "  ",
        wizard,
      }),
    ).toMatchObject({
      currencySummary: wizard.empty.currency,
      destinationSummary: wizard.empty.destinationSummary,
      inviteStatus: wizard.preview.inviteDraft,
      previewTripName: wizard.empty.untitledTrip,
    });
  });
});

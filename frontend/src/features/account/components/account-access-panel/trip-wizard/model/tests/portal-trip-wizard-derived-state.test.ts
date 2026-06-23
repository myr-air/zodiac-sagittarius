import { describe, expect, it } from "vitest";
import type { AccountTripCreateRequest } from "@/src/account/api-client";
import { buildPortalTripWizardDerivedState } from "../portal-trip-wizard-derived-state";

describe("buildPortalTripWizardDerivedState", () => {
  it("derives destination, access, and preview state from the trip form", () => {
    const state = buildPortalTripWizardDerivedState({
      accessSalt: "XYZ",
      activeMobileStep: "invite",
      defaultOwnerDisplayName: "Aom",
      hasEditedOwnerDisplayName: false,
      locale: "en",
      tripForm: {
        ...baseTripForm(),
        destinationCities: [
          { city: "Tokyo", country: "Japan", countryCode: "JP", timezone: "Asia/Tokyo", latitude: 35.6762, longitude: 139.6503 },
        ],
        endDate: "2026-06-24",
        joinPassword: "ABCD-1234",
        name: "Summer trip",
        ownerDisplayName: "",
        startDate: "2026-06-21",
      },
    });

    expect(state).toMatchObject({
      accessComplete: true,
      canSubmit: true,
      currentStepComplete: true,
      destinationComplete: true,
      effectiveOwnerDisplayName: "Aom",
      generatedJoinId: "0626-TYO-XYZ",
      generatedJoinPassword: "ABCD-1234",
      joinCode: "0626-TYO-XYZ",
      previewEndDate: "24 Jun 2026",
      previewNightCount: "3 nights (4 days)",
      previewStartDate: "21 Jun 2026",
      routeDestinationCode: "TYO",
      selectedCityNames: ["Tokyo"],
      selectedCountryNames: ["Japan"],
      selectedDestinationKey: "Tokyo",
      selectedDestinationNames: ["Tokyo"],
    });
    expect(state.destinationCards[0]).toMatchObject({ title: "Tokyo", detail: "Japan" });
  });
});

function baseTripForm(): AccountTripCreateRequest {
  return {
    countries: [],
    defaultTimezone: "",
    destinationCities: [],
    destinationLabel: "",
    endDate: "",
    joinId: "",
    joinPassword: "",
    name: "",
    originCity: "Bangkok",
    originCountry: "Thailand",
    originCountryCode: "TH",
    originLabel: "Bangkok, Thailand",
    ownerDisplayName: "",
    partySize: 2,
    startDate: "",
  };
}

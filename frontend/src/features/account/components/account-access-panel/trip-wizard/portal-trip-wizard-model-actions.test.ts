import { describe, expect, it } from "vitest";
import type { AccountTripCreateRequest } from "@/src/account/api-client";
import {
  applyPortalTripWizardCredentials,
  applyRegeneratedPortalTripWizardCredentials,
  buildPortalTripWizardSubmitForm,
  seedTripOwnerDisplayName,
} from "./portal-trip-wizard-model-actions";

describe("portal trip wizard model actions", () => {
  it("applies generated credentials only when the form needs them", () => {
    const form = {
      ...baseTripForm(),
      joinId: "0626-TYO-ABC",
      joinPassword: "ABCD-1234",
      startDate: "2026-06-21",
    };

    expect(
      applyPortalTripWizardCredentials(form, {
        accessSalt: "ABC",
        destinationNames: ["Tokyo"],
        startDate: form.startDate,
      }),
    ).toBe(form);

    expect(
      applyPortalTripWizardCredentials({ ...form, joinId: "" }, {
        accessSalt: "ABC",
        destinationNames: ["Tokyo"],
        startDate: form.startDate,
      }),
    ).toMatchObject({
      joinId: "0626-TYO-ABC",
      joinPassword: "ABCD-1234",
    });
  });

  it("regenerates the join id while accepting the provided replacement password", () => {
    expect(
      applyRegeneratedPortalTripWizardCredentials(baseTripForm(), {
        accessSalt: "XYZ",
        destinationNames: ["Tokyo"],
        joinPassword: "WXYZ-9876",
        startDate: "2026-06-21",
      }),
    ).toMatchObject({
      joinId: "0626-TYO-XYZ",
      joinPassword: "WXYZ-9876",
    });
  });

  it("seeds owner display name only when the field is empty", () => {
    expect(seedTripOwnerDisplayName(baseTripForm(), "Aom")).toMatchObject({ ownerDisplayName: "Aom" });
    expect(seedTripOwnerDisplayName({ ...baseTripForm(), ownerDisplayName: "Mew" }, "Aom")).toMatchObject({ ownerDisplayName: "Mew" });
  });

  it("builds the submit form with the generated credentials", () => {
    expect(
      buildPortalTripWizardSubmitForm(baseTripForm(), {
        joinId: "0626-TYO-XYZ",
        joinPassword: "WXYZ-9876",
      }),
    ).toMatchObject({
      joinId: "0626-TYO-XYZ",
      joinPassword: "WXYZ-9876",
    });
  });
});

function baseTripForm(): AccountTripCreateRequest {
  return {
    countries: [],
    defaultTimezone: "",
    destinationCities: [],
    destinationLabel: "",
    endDate: "2026-06-24",
    joinId: "",
    joinPassword: "ABCD-1234",
    name: "Summer trip",
    originCity: "Bangkok",
    originCountry: "Thailand",
    originCountryCode: "TH",
    originLabel: "Bangkok, Thailand",
    ownerDisplayName: "",
    partySize: 2,
    startDate: "2026-06-21",
  };
}

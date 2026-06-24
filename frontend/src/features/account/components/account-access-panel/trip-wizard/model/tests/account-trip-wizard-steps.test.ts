import { describe, expect, it } from "vitest";
import {
  getTripWizardStepNavigation,
  tripStepComplete,
  tripWizardSteps,
} from "../account-trip-wizard-steps";

describe("account trip wizard steps", () => {
  it("keeps trip wizard steps in canonical flow order", () => {
    expect(tripWizardSteps.map((step) => step.id)).toEqual([
      "trip",
      "place",
      "dates",
      "invite",
      "preview",
    ]);
  });

  it("maps each mobile step to the matching completion flag", () => {
    const state = {
      accessComplete: false,
      datesComplete: false,
      destinationComplete: true,
      tripNameComplete: false,
    };

    expect(tripStepComplete("trip", state)).toBe(false);
    expect(tripStepComplete("place", state)).toBe(true);
    expect(tripStepComplete("dates", state)).toBe(false);
    expect(tripStepComplete("invite", state)).toBe(false);
    expect(tripStepComplete("preview", state)).toBe(true);
  });

  it("derives active, previous, and next mobile step navigation", () => {
    expect(getTripWizardStepNavigation("trip")).toMatchObject({
      activeIndex: 0,
      activeStep: { id: "trip" },
      nextStep: { id: "place" },
      previousStep: null,
    });

    expect(getTripWizardStepNavigation("dates")).toMatchObject({
      activeIndex: 2,
      activeStep: { id: "dates" },
      nextStep: { id: "invite" },
      previousStep: { id: "place" },
    });

    expect(getTripWizardStepNavigation("preview")).toMatchObject({
      activeIndex: 4,
      activeStep: { id: "preview" },
      nextStep: null,
      previousStep: { id: "invite" },
    });
  });
});

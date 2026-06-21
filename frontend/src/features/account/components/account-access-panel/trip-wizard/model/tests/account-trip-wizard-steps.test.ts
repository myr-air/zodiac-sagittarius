import { describe, expect, it } from "vitest";
import { tripStepComplete, tripWizardSteps } from "../account-trip-wizard-steps";

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
});

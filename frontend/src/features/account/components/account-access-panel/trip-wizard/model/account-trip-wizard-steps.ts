export const tripWizardSteps = [
  { id: "trip", label: "Trip", regionLabel: "Trip details step", nextCopy: "Next: add destination detail" },
  { id: "place", label: "Place", regionLabel: "Destination step", nextCopy: "Next: choose route dates" },
  { id: "dates", label: "Dates", regionLabel: "Dates step", nextCopy: "Next: check invite access" },
  { id: "invite", label: "Invite", regionLabel: "Invite step", nextCopy: "Next: preview trip" },
  { id: "preview", label: "Preview", regionLabel: "Preview step", nextCopy: "Review before create" },
] as const satisfies ReadonlyArray<{ id: string; label: string; regionLabel: string; nextCopy: string }>;
export type TripWizardStepId = (typeof tripWizardSteps)[number]["id"];
export type TripWizardStep = (typeof tripWizardSteps)[number];

export interface TripWizardStepNavigation {
  activeIndex: number;
  activeStep: TripWizardStep;
  nextStep: TripWizardStep | null;
  previousStep: TripWizardStep | null;
}

export function tripStepComplete(step: TripWizardStepId, state: { tripNameComplete: boolean; destinationComplete: boolean; datesComplete: boolean; accessComplete: boolean }): boolean {
  if (step === "trip") return state.tripNameComplete;
  if (step === "place") return state.destinationComplete;
  if (step === "dates") return state.datesComplete;
  if (step === "invite") return state.accessComplete;
  return true;
}

export function getTripWizardStepNavigation(
  activeStepId: TripWizardStepId,
): TripWizardStepNavigation {
  const activeIndex = Math.max(
    0,
    tripWizardSteps.findIndex((step) => step.id === activeStepId),
  );

  return {
    activeIndex,
    activeStep: tripWizardSteps[activeIndex] ?? tripWizardSteps[0],
    nextStep: tripWizardSteps[activeIndex + 1] ?? null,
    previousStep: tripWizardSteps[activeIndex - 1] ?? null,
  };
}

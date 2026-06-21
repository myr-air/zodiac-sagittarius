import type { AccountTripCreateRequest } from "@/src/account/api-client";

export {
  formatPreviewTravelDate,
  routeCalendarDays,
  tripNightCount,
} from "@/src/trip/metadata";
export type { RouteCalendarDay } from "@/src/trip/metadata";

export const tripWizardDateSelectionStepValues = ["depart", "return"] as const;
export type TripWizardDateSelectionStep = (typeof tripWizardDateSelectionStepValues)[number];

export function applyTripStartDate(form: AccountTripCreateRequest, date: string): AccountTripCreateRequest {
  if (!date || !form.endDate) return { ...form, startDate: date };
  if (Date.parse(`${date}T00:00:00`) > Date.parse(`${form.endDate}T00:00:00`)) {
    return { ...form, startDate: form.endDate, endDate: date };
  }
  return { ...form, startDate: date };
}

export function applyTripEndDate(form: AccountTripCreateRequest, date: string): AccountTripCreateRequest {
  if (!date || !form.startDate) return { ...form, endDate: date };
  if (Date.parse(`${date}T00:00:00`) < Date.parse(`${form.startDate}T00:00:00`)) {
    return { ...form, startDate: date, endDate: form.startDate };
  }
  return { ...form, endDate: date };
}

export function applyTripCalendarDate(
  form: AccountTripCreateRequest,
  date: string,
  selectingDateStep: TripWizardDateSelectionStep,
): { form: AccountTripCreateRequest; selectingDateStep: TripWizardDateSelectionStep } {
  if (selectingDateStep === "depart") {
    return {
      form: {
        ...form,
        startDate: date,
        endDate: Date.parse(`${form.endDate}T00:00:00`) < Date.parse(`${date}T00:00:00`) ? date : form.endDate,
      },
      selectingDateStep: "return",
    };
  }

  return {
    form: applyTripEndDate(form, date),
    selectingDateStep: "depart",
  };
}

export function nextTripWizardDateSelectionStep(
  step: TripWizardDateSelectionStep,
): TripWizardDateSelectionStep {
  return step === "depart" ? "return" : "depart";
}

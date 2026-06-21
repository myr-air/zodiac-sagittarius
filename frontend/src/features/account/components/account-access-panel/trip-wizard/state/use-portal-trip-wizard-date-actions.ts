import { type Dispatch, type SetStateAction, useState } from "react";
import type { AccountTripCreateRequest } from "@/src/account/api-client";
import {
  applyTripCalendarDate,
  applyTripEndDate,
  applyTripStartDate,
  nextTripWizardDateSelectionStep,
  type TripWizardDateSelectionStep,
} from "../model/account-trip-dates";

export function usePortalTripWizardDateActions({
  onChange,
}: {
  onChange: Dispatch<SetStateAction<AccountTripCreateRequest>>;
}) {
  const [selectingDateStep, setSelectingDateStep] = useState<TripWizardDateSelectionStep>("depart");

  function swapTravelDates() {
    onChange((current) => ({ ...current, startDate: current.endDate, endDate: current.startDate }));
  }

  function updateStartDate(date: string) {
    onChange((current) => applyTripStartDate(current, date));
  }

  function updateEndDate(date: string) {
    onChange((current) => applyTripEndDate(current, date));
  }

  function selectCalendarDate(date: string) {
    onChange((current) => applyTripCalendarDate(current, date, selectingDateStep).form);
    setSelectingDateStep(nextTripWizardDateSelectionStep);
  }

  function clearTravelDates() {
    onChange((current) => ({ ...current, startDate: "", endDate: "" }));
    setSelectingDateStep("depart");
  }

  return {
    clearTravelDates,
    selectCalendarDate,
    selectingDateStep,
    swapTravelDates,
    updateEndDate,
    updateStartDate,
  };
}

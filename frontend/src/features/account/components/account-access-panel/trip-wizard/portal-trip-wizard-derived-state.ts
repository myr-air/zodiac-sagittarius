import type { AccountTripCreateRequest } from "@/src/account/api-client";
import type { Locale } from "@/src/i18n/types";
import {
  formatPreviewTravelDate,
  routeCalendarDays,
  tripNightCount,
} from "./account-trip-dates";
import {
  destinationRouteCode,
  tripDestinationCards,
  uniqueList,
} from "./account-trip-wizard-support";
import { tripStepComplete, type TripWizardStepId } from "./account-trip-wizard-steps";
import {
  buildPortalTripWizardCredentials,
  isValidPortalTripWizardJoinPassword,
} from "./portal-trip-wizard-credentials";

interface BuildPortalTripWizardDerivedStateInput {
  accessSalt: string;
  activeMobileStep: TripWizardStepId;
  defaultOwnerDisplayName: string;
  hasEditedOwnerDisplayName: boolean;
  locale: Locale;
  tripForm: AccountTripCreateRequest;
}

export function buildPortalTripWizardDerivedState({
  accessSalt,
  activeMobileStep,
  defaultOwnerDisplayName,
  hasEditedOwnerDisplayName,
  locale,
  tripForm,
}: BuildPortalTripWizardDerivedStateInput) {
  const ownerDisplayName = tripForm.ownerDisplayName;
  const effectiveOwnerDisplayName = hasEditedOwnerDisplayName ? ownerDisplayName : ownerDisplayName || defaultOwnerDisplayName;
  const selectedDestinationCities = tripForm.destinationCities;
  const selectedCountryNames = uniqueList(selectedDestinationCities.map((city) => city.country));
  const selectedCityNames = selectedDestinationCities.map((city) => city.city);
  const selectedDestinationNames = selectedCityNames;
  const selectedDestinationKey = selectedDestinationNames.join("|");
  const destinationComplete = selectedDestinationCities.length > 0;
  const datesComplete = Boolean(tripForm.startDate && tripForm.endDate);
  const credentials = buildPortalTripWizardCredentials({
    accessSalt,
    currentJoinPassword: tripForm.joinPassword,
    destinationNames: selectedDestinationNames,
    startDate: tripForm.startDate,
  });
  const generatedJoinId = credentials.joinId;
  const generatedJoinPassword = credentials.joinPassword;
  const accessComplete = Boolean(effectiveOwnerDisplayName.trim() && generatedJoinId.trim() && isValidPortalTripWizardJoinPassword(generatedJoinPassword));
  const canSubmit = Boolean(tripForm.name.trim()) && destinationComplete && datesComplete && accessComplete;

  return {
    accessComplete,
    calendarDays: routeCalendarDays(tripForm.startDate || "2026-06-01", tripForm.startDate, tripForm.endDate),
    canSubmit,
    currentStepComplete: tripStepComplete(activeMobileStep, {
      accessComplete,
      datesComplete,
      destinationComplete,
      tripNameComplete: Boolean(tripForm.name.trim()),
    }),
    datesComplete,
    destinationCards: tripDestinationCards(selectedCountryNames, selectedCityNames, locale),
    destinationComplete,
    effectiveOwnerDisplayName,
    generatedJoinId,
    generatedJoinPassword,
    isMobilePreviewStep: activeMobileStep === "preview",
    joinCode: generatedJoinId,
    ownerDisplayName,
    previewEndDate: formatPreviewTravelDate(tripForm.endDate),
    previewNightCount: tripNightCount(tripForm.startDate, tripForm.endDate, locale),
    previewStartDate: formatPreviewTravelDate(tripForm.startDate),
    routeDestinationCode: destinationRouteCode(selectedDestinationNames),
    selectedCityNames,
    selectedCountryNames,
    selectedDestinationCities,
    selectedDestinationKey,
    selectedDestinationNames,
  };
}

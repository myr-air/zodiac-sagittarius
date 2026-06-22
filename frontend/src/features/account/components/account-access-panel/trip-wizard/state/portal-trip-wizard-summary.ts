import type { Messages } from "@/src/i18n/messages";
import { uniqueIds } from "@/src/shared/collection";
import { tripCountryOptions } from "../model/account-trip-destinations";

interface BuildPortalTripWizardSummaryInput {
  accessComplete: boolean;
  canSubmit: boolean;
  datesComplete: boolean;
  destinationComplete: boolean;
  selectedCountryNames: string[];
  selectedDestinationNames: string[];
  tripName: string;
  wizard: Messages["access"]["dashboard"]["createTrip"]["wizard"];
}

export function buildPortalTripWizardSummary({
  accessComplete,
  canSubmit,
  datesComplete,
  destinationComplete,
  selectedCountryNames,
  selectedDestinationNames,
  tripName,
  wizard,
}: BuildPortalTripWizardSummaryInput) {
  const destinationSummary = selectedDestinationNames.length
    ? selectedDestinationNames.join(", ")
    : wizard.empty.destinationSummary;
  const currencySummary = selectedCountryNames.length
    ? uniqueIds(
        selectedCountryNames
          .map((countryName) =>
            tripCountryOptions.find((country) => country.name === countryName)?.currency ?? "",
          )
          .filter(Boolean),
      ).join(", ") || wizard.empty.currencyByCity
    : wizard.empty.currency;
  const inviteStatus = accessComplete
    ? wizard.preview.inviteReady
    : wizard.preview.inviteDraft;
  const previewTripName = tripName.trim() || wizard.empty.untitledTrip;
  const missingFields = [
    tripName.trim() ? null : wizard.status.fields.trip,
    destinationComplete ? null : wizard.status.fields.destination,
    datesComplete ? null : wizard.status.fields.dates,
    accessComplete ? null : wizard.status.fields.invite,
  ].filter(Boolean).join(", ");
  const createStatusText = canSubmit
    ? wizard.status.ready
    : wizard.status.required({ fields: missingFields });

  return {
    createStatusText,
    currencySummary,
    destinationSummary,
    inviteStatus,
    previewTripName,
  };
}

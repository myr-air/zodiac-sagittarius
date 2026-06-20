"use client";

import type { AccountTripCreateRequest } from "@/src/account/api-client";
import { Icon } from "@/src/ui/icons";
import * as wizardStyles from "./portal-trip-wizard-styles";

interface TripWizardReviewSummaryProps {
  destinationSummary: string;
  tripForm: AccountTripCreateRequest;
  wizard: {
    empty: {
      missingDates: string;
      newTrip: string;
    };
    helper: {
      postCreateEditable: string;
    };
    review: {
      dates: string;
      destinations: string;
      trip: string;
    };
  };
}

export function TripWizardReviewSummary({ destinationSummary, tripForm, wizard }: TripWizardReviewSummaryProps) {
  return (
    <>
      <div className={wizardStyles.tripAccessNoteClassName}>
        <Icon name="key" />
        <span>{wizard.helper.postCreateEditable}</span>
      </div>
      <div className={wizardStyles.tripTicketReviewClassName}>
        <div>
          <span>{wizard.review.trip}</span>
          <strong>{tripForm.name || wizard.empty.newTrip}</strong>
        </div>
        <div>
          <span>{wizard.review.destinations}</span>
          <strong>{destinationSummary}</strong>
        </div>
        <div>
          <span>{wizard.review.dates}</span>
          <strong>{tripForm.startDate && tripForm.endDate ? `${tripForm.startDate} - ${tripForm.endDate}` : wizard.empty.missingDates}</strong>
        </div>
      </div>
    </>
  );
}

"use client";

import type { AccountTripCreateRequest } from "@/src/account/api-client";
import { tripWizardSteps } from "./model/account-trip-wizard-steps";
import * as wizardStyles from "./portal-trip-wizard-styles";

interface TripWizardTripStepProps {
  activeMobileStep: string;
  mobileStepClassName: (stepId: "trip") => string;
  nameLabel: string;
  tripForm: AccountTripCreateRequest;
  wizard: {
    placeholders: {
      tripName: string;
    };
    steps: {
      trip: {
        detail: string;
        title: string;
      };
    };
  };
  onTripNameChange: (value: string) => void;
}

export function TripWizardTripStep({
  activeMobileStep,
  mobileStepClassName,
  nameLabel,
  onTripNameChange,
  tripForm,
  wizard,
}: TripWizardTripStepProps) {
  return (
    <section className={mobileStepClassName("trip")} role="region" aria-label={tripWizardSteps[0].regionLabel} data-mobile-active={activeMobileStep === "trip" ? "true" : "false"}>
      <div className={wizardStyles.tripStepHeadingClassName}>
        <strong>{wizard.steps.trip.title}</strong>
        <span>{wizard.steps.trip.detail}</span>
      </div>
      <label className={wizardStyles.tripNameFieldClassName}>
        <span className="sr-only">{nameLabel}</span>
        <input
          value={tripForm.name}
          onChange={(event) => onTripNameChange(event.target.value)}
          placeholder={wizard.placeholders.tripName}
          maxLength={100}
          required
        />
        <small>{tripForm.name.length} / 100</small>
      </label>
    </section>
  );
}

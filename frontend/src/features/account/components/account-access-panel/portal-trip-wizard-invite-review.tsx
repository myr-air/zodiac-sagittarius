"use client";

import type { AccountTripCreateRequest } from "@/src/account/api-client";
import { Button } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import { tripWizardSteps } from "./account-trip-wizard-support";
import * as wizardStyles from "./portal-trip-wizard-styles";

interface TripWizardInviteStepProps {
  activeMobileStep: string;
  defaultOwnerDisplayName: string;
  effectiveOwnerDisplayName: string;
  generatedJoinId: string;
  generatedJoinPassword: string;
  mobileStepClassName: (stepId: "invite", baseClassName?: string) => string;
  t: {
    access: {
      dashboard: {
        createTrip: {
          labels: {
            joinId: string;
            joinPassword: string;
            ownerDisplayName: string;
          };
        };
      };
    };
  };
  wizard: {
    actions: {
      regenerate: string;
    };
    helper: {
      joinIdHint: string;
      ownerDefault: string;
    };
    steps: {
      invite: {
        title: string;
      };
    };
  };
  onOwnerDisplayNameChange: (value: string) => void;
  onRegenerateCredentials: () => void;
}

export function TripWizardInviteStep({
  activeMobileStep,
  defaultOwnerDisplayName,
  effectiveOwnerDisplayName,
  generatedJoinId,
  generatedJoinPassword,
  mobileStepClassName,
  onOwnerDisplayNameChange,
  onRegenerateCredentials,
  t,
  wizard,
}: TripWizardInviteStepProps) {
  return (
    <section className={mobileStepClassName("invite", wizardStyles.tripStepSectionCompactClassName)} role="region" aria-label={tripWizardSteps[3].regionLabel} data-mobile-active={activeMobileStep === "invite" ? "true" : "false"}>
      <details className={wizardStyles.tripAccessPanelClassName} {...(activeMobileStep === "invite" ? { open: true } : {})}>
        <summary>
          <span>{wizard.steps.invite.title}</span>
          <strong>{effectiveOwnerDisplayName || defaultOwnerDisplayName}</strong>
        </summary>
        <label>
          <span>{t.access.dashboard.createTrip.labels.ownerDisplayName}</span>
          <input
            value={effectiveOwnerDisplayName}
            onChange={(event) => onOwnerDisplayNameChange(event.target.value)}
            autoComplete="name"
            required
          />
          <small>{wizard.helper.ownerDefault}</small>
        </label>
        <div className={wizardStyles.tripGeneratedAccessClassName}>
          <label>
            <span>{t.access.dashboard.createTrip.labels.joinId}</span>
            <input value={generatedJoinId} readOnly />
            <small>{wizard.helper.joinIdHint}</small>
          </label>
          <label>
            <span>{t.access.dashboard.createTrip.labels.joinPassword}</span>
            <input value={generatedJoinPassword} readOnly />
          </label>
          <Button type="button" variant="secondary" onClick={onRegenerateCredentials}>
            <Icon name="route" />
            {wizard.actions.regenerate}
          </Button>
        </div>
      </details>
    </section>
  );
}

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

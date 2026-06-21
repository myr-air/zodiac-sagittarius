"use client";

import { tripWizardSteps } from "./model/account-trip-wizard-steps";
import { TripWizardGeneratedAccess } from "./portal-trip-wizard-generated-access";
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
        <TripWizardGeneratedAccess
          generatedJoinId={generatedJoinId}
          generatedJoinPassword={generatedJoinPassword}
          joinIdHint={wizard.helper.joinIdHint}
          labels={t.access.dashboard.createTrip.labels}
          regenerateLabel={wizard.actions.regenerate}
          onRegenerateCredentials={onRegenerateCredentials}
        />
      </details>
    </section>
  );
}

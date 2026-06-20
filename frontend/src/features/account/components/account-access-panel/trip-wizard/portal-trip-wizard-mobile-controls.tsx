"use client";

import type { RefObject } from "react";
import { Button } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import { useI18n } from "@/src/i18n/I18nProvider";
import { tripWizardSteps, type TripWizardStepId } from "./account-trip-wizard-steps";
import * as wizardStyles from "./portal-trip-wizard-styles";

interface TripWizardWorkflowNavProps {
  activeMobileStep: TripWizardStepId;
  mobileStepButtonRefs: RefObject<Map<TripWizardStepId, HTMLButtonElement>>;
  onActiveMobileStepChange: (step: TripWizardStepId) => void;
}

export function TripWizardWorkflowNav({
  activeMobileStep,
  mobileStepButtonRefs,
  onActiveMobileStepChange,
}: TripWizardWorkflowNavProps) {
  const { t } = useI18n();
  const wizard = t.access.dashboard.createTrip.wizard;
  const activeMobileStepIndex = Math.max(0, tripWizardSteps.findIndex((step) => step.id === activeMobileStep));
  const activeMobileStepMeta = tripWizardSteps[activeMobileStepIndex] ?? tripWizardSteps[0];

  return (
    <nav className={wizardStyles.tripWorkflowNavClassName} aria-label="Trip creation workflow">
      <ol>
        {tripWizardSteps.map((step) => (
          <li key={step.id}>
            <button
              type="button"
              aria-current={activeMobileStep === step.id ? "step" : undefined}
              aria-label={`${wizard.stepNames[step.id]} step`}
              onClick={() => onActiveMobileStepChange(step.id)}
              ref={(node) => {
                if (node) mobileStepButtonRefs.current.set(step.id, node);
                else mobileStepButtonRefs.current.delete(step.id);
              }}
            >
              {wizard.stepNames[step.id]}
            </button>
          </li>
        ))}
      </ol>
      <p>{wizard.workflow[activeMobileStepMeta.id]}</p>
    </nav>
  );
}

interface TripWizardMobileStepActionsProps {
  activeMobileStep: TripWizardStepId;
  currentStepComplete: boolean;
  onActiveMobileStepChange: (step: TripWizardStepId) => void;
}

export function TripWizardMobileStepActions({
  activeMobileStep,
  currentStepComplete,
  onActiveMobileStepChange,
}: TripWizardMobileStepActionsProps) {
  const { t } = useI18n();
  const wizard = t.access.dashboard.createTrip.wizard;
  const activeMobileStepIndex = Math.max(0, tripWizardSteps.findIndex((step) => step.id === activeMobileStep));
  const previousMobileStep = tripWizardSteps[activeMobileStepIndex - 1] ?? null;
  const nextMobileStep = tripWizardSteps[activeMobileStepIndex + 1] ?? null;

  return (
    <div className={wizardStyles.tripMobileStepActionsClassName} aria-label="Mobile step controls">
      <Button
        type="button"
        variant="secondary"
        disabled={!previousMobileStep}
        aria-label={previousMobileStep ? `${wizard.actions.back}: ${wizard.stepNames[previousMobileStep.id]}` : wizard.actions.back}
        onClick={() => previousMobileStep ? onActiveMobileStepChange(previousMobileStep.id) : undefined}
      >
        <Icon name="chevronLeft" />
        {wizard.actions.back}
      </Button>
      <span>{activeMobileStepIndex + 1} / {tripWizardSteps.length}</span>
      <Button
        type="button"
        variant="secondary"
        disabled={!nextMobileStep || !currentStepComplete}
        aria-label={nextMobileStep ? `${wizard.actions.next}: ${wizard.stepNames[nextMobileStep.id]}` : wizard.actions.next}
        onClick={() => nextMobileStep ? onActiveMobileStepChange(nextMobileStep.id) : undefined}
      >
        {wizard.actions.next}
        <Icon name="chevronRight" />
      </Button>
    </div>
  );
}

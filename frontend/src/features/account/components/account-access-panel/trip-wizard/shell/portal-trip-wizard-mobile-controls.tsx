"use client";

import type { RefObject } from "react";
import { Button } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import { useI18n } from "@/src/i18n/I18nProvider";
import {
  getTripWizardStepNavigation,
  tripWizardSteps,
  type TripWizardStepId,
} from "../model/account-trip-wizard-steps";
import * as wizardStyles from "../layout/portal-trip-wizard-styles";

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
  const { activeStep } = getTripWizardStepNavigation(activeMobileStep);

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
      <p>{wizard.workflow[activeStep.id]}</p>
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
  const {
    activeIndex,
    nextStep,
    previousStep,
  } = getTripWizardStepNavigation(activeMobileStep);

  return (
    <div className={wizardStyles.tripMobileStepActionsClassName} aria-label="Mobile step controls">
      <Button
        type="button"
        variant="secondary"
        disabled={!previousStep}
        aria-label={previousStep ? `${wizard.actions.back}: ${wizard.stepNames[previousStep.id]}` : wizard.actions.back}
        onClick={() => previousStep ? onActiveMobileStepChange(previousStep.id) : undefined}
      >
        <Icon name="chevronLeft" />
        {wizard.actions.back}
      </Button>
      <span>{activeIndex + 1} / {tripWizardSteps.length}</span>
      <Button
        type="button"
        variant="secondary"
        disabled={!nextStep || !currentStepComplete}
        aria-label={nextStep ? `${wizard.actions.next}: ${wizard.stepNames[nextStep.id]}` : wizard.actions.next}
        onClick={() => nextStep ? onActiveMobileStepChange(nextStep.id) : undefined}
      >
        {wizard.actions.next}
        <Icon name="chevronRight" />
      </Button>
    </div>
  );
}

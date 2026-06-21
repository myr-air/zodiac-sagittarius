import { useEffect, useRef, useState } from "react";
import { cn } from "@/src/lib/cn";
import type { TripWizardStepId } from "../model/account-trip-wizard-steps";
import * as wizardStyles from "../portal-trip-wizard-styles";

export function usePortalTripWizardMobileState() {
  const [activeMobileStep, setActiveMobileStep] = useState<TripWizardStepId>("trip");
  const mobileStepButtonRefs = useRef<Map<TripWizardStepId, HTMLButtonElement>>(new Map());

  useEffect(() => {
    mobileStepButtonRefs.current
      .get(activeMobileStep)
      ?.scrollIntoView?.({ block: "nearest", inline: "center" });
  }, [activeMobileStep]);

  function mobileStepClassName(
    stepId: TripWizardStepId,
    baseClassName = wizardStyles.tripStepSectionClassName,
  ) {
    return cn(baseClassName, activeMobileStep === stepId ? "" : "max-[767px]:hidden");
  }

  return {
    activeMobileStep,
    mobileStepButtonRefs,
    mobileStepClassName,
    setActiveMobileStep,
  };
}

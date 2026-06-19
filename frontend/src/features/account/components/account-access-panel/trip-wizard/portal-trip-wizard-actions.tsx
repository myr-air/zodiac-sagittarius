"use client";

import Link from "next/link";
import { appRoutes } from "@/src/trip/workspace/sagittarius-app/support";
import { Button } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import * as wizardStyles from "./portal-trip-wizard-styles";

interface PortalTripWizardActionsProps {
  canSubmit: boolean;
  createLabel: string;
  createStatusText: string;
  creatingLabel: string;
  destinationSummary: string;
  isSubmitting: boolean;
  previewEndDate: string;
  previewNightCount: string;
  previewStartDate: string;
  previewTripName: string;
  cancelLabel: string;
}

export function PortalTripWizardActions({
  canSubmit,
  cancelLabel,
  createLabel,
  createStatusText,
  creatingLabel,
  destinationSummary,
  isSubmitting,
  previewEndDate,
  previewNightCount,
  previewStartDate,
  previewTripName,
}: PortalTripWizardActionsProps) {
  return (
    <div className={wizardStyles.tripWizardActionsClassName} role="group" aria-label="Create trip status">
      <p className={wizardStyles.tripWizardActionStatusClassName}>
        <Icon name={canSubmit ? "check" : "key"} />
        {createStatusText}
      </p>
      <div className={wizardStyles.tripWizardActionSummaryClassName} aria-hidden="true">
        <strong>{previewTripName}</strong>
        <span>{destinationSummary}</span>
        <span>{previewStartDate} - {previewEndDate} · {previewNightCount}</span>
      </div>
      <div className={wizardStyles.tripWizardActionButtonsClassName}>
        <Button asChild type="button" variant="secondary">
          <Link href={appRoutes.portalMyTrips()}>
            <Icon name="chevronLeft" />
            {cancelLabel}
          </Link>
        </Button>
        <Button type="submit" disabled={isSubmitting || !canSubmit}>
          <Icon name="check" />
          {isSubmitting ? creatingLabel : createLabel}
        </Button>
      </div>
    </div>
  );
}

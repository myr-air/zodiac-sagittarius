"use client";

import { Button } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import * as wizardStyles from "./layout/portal-trip-wizard-styles";

interface TripWizardGeneratedAccessProps {
  generatedJoinId: string;
  generatedJoinPassword: string;
  labels: {
    joinId: string;
    joinPassword: string;
  };
  regenerateLabel: string;
  joinIdHint: string;
  onRegenerateCredentials: () => void;
}

export function TripWizardGeneratedAccess({
  generatedJoinId,
  generatedJoinPassword,
  joinIdHint,
  labels,
  onRegenerateCredentials,
  regenerateLabel,
}: TripWizardGeneratedAccessProps) {
  return (
    <div className={wizardStyles.tripGeneratedAccessClassName}>
      <label>
        <span>{labels.joinId}</span>
        <input value={generatedJoinId} readOnly />
        <small>{joinIdHint}</small>
      </label>
      <label>
        <span>{labels.joinPassword}</span>
        <input value={generatedJoinPassword} readOnly />
      </label>
      <Button type="button" variant="secondary" onClick={onRegenerateCredentials}>
        <Icon name="route" />
        {regenerateLabel}
      </Button>
    </div>
  );
}

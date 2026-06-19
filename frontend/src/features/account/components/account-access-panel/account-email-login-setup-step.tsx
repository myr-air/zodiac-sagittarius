"use client";

import { AccountStepSummary } from "./account-email-login-fields";
import { Button } from "@/src/ui";
import { Icon } from "@/src/ui/icons";

interface EmailLoginSetupStepProps {
  displayName: string;
  homeBase: string;
  isSubmitting: boolean;
  normalizedEmail: string;
  labels: {
    createFor: string;
    displayName: string;
    finishSetup: string;
    homeBase: string;
  };
  onDisplayNameChange: (value: string) => void;
  onHomeBaseChange: (value: string) => void;
}

export function EmailLoginSetupStep({
  displayName,
  homeBase,
  isSubmitting,
  labels,
  normalizedEmail,
  onDisplayNameChange,
  onHomeBaseChange,
}: EmailLoginSetupStepProps) {
  return (
    <>
      <AccountStepSummary label={labels.createFor} value={normalizedEmail} />
      <label>
        <span>{labels.displayName}</span>
        <input value={displayName} onChange={(event) => onDisplayNameChange(event.target.value)} autoComplete="name" placeholder="Aom Traveler" required suppressHydrationWarning />
      </label>
      <label>
        <span>{labels.homeBase}</span>
        <input value={homeBase} onChange={(event) => onHomeBaseChange(event.target.value)} autoComplete="address-level2" placeholder="Bangkok" suppressHydrationWarning />
      </label>
      <Button type="submit" disabled={!displayName.trim() || isSubmitting}>
        <Icon name="check" />
        {labels.finishSetup}
      </Button>
    </>
  );
}

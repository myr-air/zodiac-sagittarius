import { type Dispatch, type SetStateAction, useEffect } from "react";
import type { AccountTripCreateRequest } from "@/src/account/api-client";
import { applyPortalTripWizardCredentials } from "./portal-trip-wizard-model-actions";

interface UsePortalTripWizardCredentialSyncOptions {
  accessSalt: string;
  onChange: Dispatch<SetStateAction<AccountTripCreateRequest>>;
  selectedDestinationKey: string;
  startDate: string;
}

export function usePortalTripWizardCredentialSync({
  accessSalt,
  onChange,
  selectedDestinationKey,
  startDate,
}: UsePortalTripWizardCredentialSyncOptions) {
  useEffect(() => {
    onChange((current) =>
      applyPortalTripWizardCredentials(current, {
        accessSalt,
        destinationNames: selectedDestinationKey.split("|").filter(Boolean),
        startDate: current.startDate,
      }),
    );
  }, [accessSalt, onChange, selectedDestinationKey, startDate]);
}

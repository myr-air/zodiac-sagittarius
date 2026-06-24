import { type Dispatch, type SetStateAction, useState } from "react";
import type { AccountTripCreateRequest } from "@/src/account/api-client";
import { seedTripOwnerDisplayName } from "./portal-trip-wizard-model-actions";

export function usePortalTripWizardOwnerActions({
  defaultOwnerDisplayName,
  onChange,
}: {
  defaultOwnerDisplayName: string;
  onChange: Dispatch<SetStateAction<AccountTripCreateRequest>>;
}) {
  const [hasEditedOwnerDisplayName, setHasEditedOwnerDisplayName] = useState(false);

  function seedOwnerDisplayName() {
    onChange((current) => seedTripOwnerDisplayName(current, defaultOwnerDisplayName));
  }

  function changeOwnerDisplayName(value: string) {
    setHasEditedOwnerDisplayName(true);
    onChange((current) => ({ ...current, ownerDisplayName: value }));
  }

  return {
    changeOwnerDisplayName,
    hasEditedOwnerDisplayName,
    seedOwnerDisplayName,
  };
}

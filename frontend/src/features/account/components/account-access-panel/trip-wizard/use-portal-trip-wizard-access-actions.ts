import { type Dispatch, type SetStateAction, useState } from "react";
import type { AccountTripCreateRequest } from "@/src/account/api-client";
import { useCopyFeedbackState } from "@/src/shared/hooks/use-copy-feedback-state";
import {
  generateJoinPassword,
  randomToken,
} from "./account-trip-wizard-support";
import { applyRegeneratedPortalTripWizardCredentials } from "./portal-trip-wizard-model-actions";

export function usePortalTripWizardAccessActions({
  onChange,
}: {
  onChange: Dispatch<SetStateAction<AccountTripCreateRequest>>;
}) {
  const { copyText, hasCopied: hasCopiedJoinCode } = useCopyFeedbackState();
  const [accessSalt, setAccessSalt] = useState(() => randomToken(3));

  function regenerateCredentials({
    selectedDestinationNames,
  }: {
    selectedDestinationNames: string[];
  }) {
    const nextSalt = randomToken(3);
    setAccessSalt(nextSalt);
    onChange((current) =>
      applyRegeneratedPortalTripWizardCredentials(current, {
        accessSalt: nextSalt,
        destinationNames: selectedDestinationNames,
        joinPassword: generateJoinPassword(),
        startDate: current.startDate,
      }),
    );
  }

  async function copyJoinCode(joinCode: string) {
    const text = joinCode.trim();
    if (!text) return;
    await copyText(text);
  }

  return {
    accessSalt,
    copyJoinCode,
    hasCopiedJoinCode,
    regenerateCredentials,
  };
}

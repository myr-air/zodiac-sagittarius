import { type Dispatch, type FormEvent, type SetStateAction, useState } from "react";
import type { AccountTripCreateRequest } from "@/src/account/api-client";
import { useI18n } from "@/src/i18n/I18nProvider";
import { useCopyFeedbackState } from "@/src/shared/hooks/use-copy-feedback-state";
import {
  generateJoinPassword,
  randomToken,
} from "./account-trip-wizard-support";
import { buildPortalTripWizardDerivedState } from "./portal-trip-wizard-derived-state";
import {
  applyRegeneratedPortalTripWizardCredentials,
  buildPortalTripWizardSubmitForm,
  seedTripOwnerDisplayName,
} from "./portal-trip-wizard-model-actions";
import { buildPortalTripWizardSummary } from "./portal-trip-wizard-summary";
import { usePortalTripWizardCredentialSync } from "./use-portal-trip-wizard-credential-sync";
import { usePortalTripWizardDateActions } from "./use-portal-trip-wizard-date-actions";
import { usePortalTripWizardDestinationState } from "./use-portal-trip-wizard-destination-state";
import { usePortalTripWizardMobileState } from "./use-portal-trip-wizard-mobile-state";

interface PortalTripWizardModelOptions {
  defaultOwnerDisplayName: string;
  isSubmitting: boolean;
  onChange: Dispatch<SetStateAction<AccountTripCreateRequest>>;
  onSubmit: (form?: AccountTripCreateRequest) => void;
  tripForm: AccountTripCreateRequest;
}

export function usePortalTripWizardModel({
  defaultOwnerDisplayName,
  isSubmitting,
  onChange,
  onSubmit,
  tripForm,
}: PortalTripWizardModelOptions) {
  const { locale, t } = useI18n();
  const wizard = t.access.dashboard.createTrip.wizard;
  const [hasEditedOwnerDisplayName, setHasEditedOwnerDisplayName] = useState(false);
  const { copyText, hasCopied: hasCopiedJoinCode } = useCopyFeedbackState();
  const [accessSalt, setAccessSalt] = useState(() => randomToken(3));
  const dateActions = usePortalTripWizardDateActions({ onChange });
  const {
    activeMobileStep,
    mobileStepButtonRefs,
    mobileStepClassName,
    setActiveMobileStep,
  } = usePortalTripWizardMobileState();
  const derivedState = buildPortalTripWizardDerivedState({
    accessSalt,
    activeMobileStep,
    defaultOwnerDisplayName,
    hasEditedOwnerDisplayName,
    locale,
    tripForm,
  });
  const summary = buildPortalTripWizardSummary({
    accessComplete: derivedState.accessComplete,
    canSubmit: derivedState.canSubmit,
    datesComplete: derivedState.datesComplete,
    destinationComplete: derivedState.destinationComplete,
    selectedCountryNames: derivedState.selectedCountryNames,
    selectedDestinationNames: derivedState.selectedDestinationNames,
    tripName: tripForm.name,
    wizard,
  });
  const destinationState = usePortalTripWizardDestinationState({
    onChange,
    selectedDestinationCities: derivedState.selectedDestinationCities,
    selectedDestinationNames: derivedState.selectedDestinationNames,
  });

  usePortalTripWizardCredentialSync({
    accessSalt,
    onChange,
    selectedDestinationKey: derivedState.selectedDestinationKey,
    startDate: tripForm.startDate,
  });

  function seedOwnerDisplayName() {
    onChange((current) => seedTripOwnerDisplayName(current, defaultOwnerDisplayName));
  }

  function regenerateCredentials() {
    const nextSalt = randomToken(3);
    setAccessSalt(nextSalt);
    onChange((current) =>
      applyRegeneratedPortalTripWizardCredentials(current, {
        accessSalt: nextSalt,
        destinationNames: derivedState.selectedDestinationNames,
        joinPassword: generateJoinPassword(),
        startDate: current.startDate,
      }),
    );
  }

  async function copyJoinCode() {
    const text = derivedState.joinCode.trim();
    if (!text) return;
    await copyText(text);
  }

  function submitWizard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    seedOwnerDisplayName();
    const nextForm = buildPortalTripWizardSubmitForm(tripForm, {
      joinId: derivedState.generatedJoinId,
      joinPassword: derivedState.generatedJoinPassword,
    });
    onChange(nextForm);
    if (derivedState.canSubmit && !isSubmitting) onSubmit(nextForm);
  }

  function changeOwnerDisplayName(value: string) {
    setHasEditedOwnerDisplayName(true);
    onChange((current) => ({ ...current, ownerDisplayName: value }));
  }

  return {
    ...derivedState,
    ...summary,
    activeMobileStep,
    ...destinationState,
    changeOwnerDisplayName,
    copyJoinCode,
    ...dateActions,
    hasCopiedJoinCode,
    mobileStepButtonRefs,
    mobileStepClassName,
    regenerateCredentials,
    setActiveMobileStep,
    submitWizard,
    t,
    wizard,
  };
}

export type PortalTripWizardModel = ReturnType<typeof usePortalTripWizardModel>;

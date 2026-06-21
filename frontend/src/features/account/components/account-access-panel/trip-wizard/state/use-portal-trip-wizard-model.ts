import { type Dispatch, type FormEvent, type SetStateAction } from "react";
import type { AccountTripCreateRequest } from "@/src/account/api-client";
import { useI18n } from "@/src/i18n/I18nProvider";
import { buildPortalTripWizardDerivedState } from "./portal-trip-wizard-derived-state";
import { buildPortalTripWizardSubmitForm } from "./portal-trip-wizard-model-actions";
import { buildPortalTripWizardSummary } from "./portal-trip-wizard-summary";
import { usePortalTripWizardAccessActions } from "./use-portal-trip-wizard-access-actions";
import { usePortalTripWizardCredentialSync } from "./use-portal-trip-wizard-credential-sync";
import { usePortalTripWizardDateActions } from "./use-portal-trip-wizard-date-actions";
import { usePortalTripWizardDestinationState } from "./use-portal-trip-wizard-destination-state";
import { usePortalTripWizardMobileState } from "./use-portal-trip-wizard-mobile-state";
import { usePortalTripWizardOwnerActions } from "./use-portal-trip-wizard-owner-actions";

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
  const ownerActions = usePortalTripWizardOwnerActions({
    defaultOwnerDisplayName,
    onChange,
  });
  const dateActions = usePortalTripWizardDateActions({ onChange });
  const accessActions = usePortalTripWizardAccessActions({ onChange });
  const {
    activeMobileStep,
    mobileStepButtonRefs,
    mobileStepClassName,
    setActiveMobileStep,
  } = usePortalTripWizardMobileState();
  const derivedState = buildPortalTripWizardDerivedState({
    accessSalt: accessActions.accessSalt,
    activeMobileStep,
    defaultOwnerDisplayName,
    hasEditedOwnerDisplayName: ownerActions.hasEditedOwnerDisplayName,
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
    accessSalt: accessActions.accessSalt,
    onChange,
    selectedDestinationKey: derivedState.selectedDestinationKey,
    startDate: tripForm.startDate,
  });

  function regenerateCredentials() {
    accessActions.regenerateCredentials({
      selectedDestinationNames: derivedState.selectedDestinationNames,
    });
  }

  async function copyJoinCode() {
    await accessActions.copyJoinCode(derivedState.joinCode);
  }

  function submitWizard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    ownerActions.seedOwnerDisplayName();
    const nextForm = buildPortalTripWizardSubmitForm(tripForm, {
      joinId: derivedState.generatedJoinId,
      joinPassword: derivedState.generatedJoinPassword,
    });
    onChange(nextForm);
    if (derivedState.canSubmit && !isSubmitting) onSubmit(nextForm);
  }

  return {
    ...derivedState,
    ...summary,
    activeMobileStep,
    ...destinationState,
    changeOwnerDisplayName: ownerActions.changeOwnerDisplayName,
    accessSalt: accessActions.accessSalt,
    copyJoinCode,
    ...dateActions,
    hasCopiedJoinCode: accessActions.hasCopiedJoinCode,
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

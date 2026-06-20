import { type Dispatch, type FormEvent, type SetStateAction, useEffect, useState } from "react";
import type { AccountTripCreateRequest } from "@/src/account/api-client";
import { useI18n } from "@/src/i18n/I18nProvider";
import {
  applyTripCalendarDate,
  applyTripEndDate,
  applyTripStartDate,
  generateJoinPassword,
  randomToken,
  type TripWizardDateSelectionStep,
} from "./account-trip-wizard-support";
import { buildPortalTripWizardCredentials } from "./portal-trip-wizard-credentials";
import { buildPortalTripWizardDerivedState } from "./portal-trip-wizard-derived-state";
import { buildPortalTripWizardSummary } from "./portal-trip-wizard-summary";
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
  const [hasCopiedJoinCode, setHasCopiedJoinCode] = useState(false);
  const [selectingDateStep, setSelectingDateStep] = useState<TripWizardDateSelectionStep>("depart");
  const [accessSalt, setAccessSalt] = useState(() => randomToken(3));
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

  useEffect(() => {
    onChange((current) => {
      const credentials = buildPortalTripWizardCredentials({
        accessSalt,
        currentJoinPassword: current.joinPassword,
        destinationNames: derivedState.selectedDestinationKey.split("|").filter(Boolean),
        startDate: current.startDate,
      });
      if (current.joinId === credentials.joinId && current.joinPassword === credentials.joinPassword) return current;
      return { ...current, joinId: credentials.joinId, joinPassword: credentials.joinPassword };
    });
  }, [accessSalt, derivedState.selectedDestinationKey, onChange]);

  function seedOwnerDisplayName() {
    onChange((current) => current.ownerDisplayName.trim() ? current : { ...current, ownerDisplayName: defaultOwnerDisplayName });
  }

  function regenerateCredentials() {
    const nextSalt = randomToken(3);
    setAccessSalt(nextSalt);
    onChange((current) => ({
      ...current,
      joinId: buildPortalTripWizardCredentials({
        accessSalt: nextSalt,
        currentJoinPassword: current.joinPassword,
        destinationNames: derivedState.selectedDestinationNames,
        startDate: current.startDate,
      }).joinId,
      joinPassword: generateJoinPassword(),
    }));
  }

  function swapTravelDates() {
    onChange((current) => ({ ...current, startDate: current.endDate, endDate: current.startDate }));
  }

  function updateStartDate(date: string) {
    onChange((current) => applyTripStartDate(current, date));
  }

  function updateEndDate(date: string) {
    onChange((current) => applyTripEndDate(current, date));
  }

  function selectCalendarDate(date: string) {
    onChange((current) => applyTripCalendarDate(current, date, selectingDateStep).form);
    setSelectingDateStep((current) => (current === "depart" ? "return" : "depart"));
  }

  function clearTravelDates() {
    onChange((current) => ({ ...current, startDate: "", endDate: "" }));
    setSelectingDateStep("depart");
  }

  async function copyJoinCode() {
    const text = derivedState.joinCode.trim();
    if (!text) return;
    try {
      await navigator.clipboard?.writeText(text);
      setHasCopiedJoinCode(true);
    } catch {
      setHasCopiedJoinCode(false);
    }
  }

  function submitWizard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    seedOwnerDisplayName();
    const nextForm = { ...tripForm, joinId: derivedState.generatedJoinId, joinPassword: derivedState.generatedJoinPassword };
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
    clearTravelDates,
    copyJoinCode,
    hasCopiedJoinCode,
    mobileStepButtonRefs,
    mobileStepClassName,
    regenerateCredentials,
    selectCalendarDate,
    selectingDateStep,
    setActiveMobileStep,
    submitWizard,
    swapTravelDates,
    t,
    updateEndDate,
    updateStartDate,
    wizard,
  };
}

export type PortalTripWizardModel = ReturnType<typeof usePortalTripWizardModel>;

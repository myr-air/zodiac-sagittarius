import { type Dispatch, type FormEvent, type SetStateAction, useEffect, useRef, useState } from "react";
import type { AccountTripCreateRequest } from "@/src/account/api-client";
import { useI18n } from "@/src/i18n/I18nProvider";
import { cn } from "@/src/lib/cn";
import type { TripCity } from "@/src/trip/types";
import {
  applyTripCalendarDate,
  applyTripDestinationCities,
  applyTripEndDate,
  applyTripStartDate,
  customTripCity,
  generateJoinIdForTrip,
  generateJoinPassword,
  randomToken,
  tripCityFromOption,
  type TripCityOption,
  type TripWizardDateSelectionStep,
  type TripWizardStepId,
} from "./account-trip-wizard-support";
import { buildPortalTripWizardDerivedState } from "./portal-trip-wizard-derived-state";
import { buildPortalTripWizardSummary } from "./portal-trip-wizard-summary";
import * as wizardStyles from "./portal-trip-wizard-styles";

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
  const [countryQuery, setCountryQuery] = useState("");
  const [cityQuery, setCityQuery] = useState("");
  const [hasEditedOwnerDisplayName, setHasEditedOwnerDisplayName] = useState(false);
  const [hasCopiedJoinCode, setHasCopiedJoinCode] = useState(false);
  const [selectingDateStep, setSelectingDateStep] = useState<TripWizardDateSelectionStep>("depart");
  const [accessSalt, setAccessSalt] = useState(() => randomToken(3));
  const [activeMobileStep, setActiveMobileStep] = useState<TripWizardStepId>("trip");
  const destinationSearchRef = useRef<HTMLInputElement | null>(null);
  const mobileStepButtonRefs = useRef<Map<TripWizardStepId, HTMLButtonElement>>(new Map());
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

  useEffect(() => {
    onChange((current) => {
      const nextJoinId = generateJoinIdForTrip(current.startDate, derivedState.selectedDestinationKey.split("|").filter(Boolean), accessSalt);
      const nextJoinPassword = current.joinPassword.match(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/) ? current.joinPassword : generateJoinPassword();
      if (current.joinId === nextJoinId && current.joinPassword === nextJoinPassword) return current;
      return { ...current, joinId: nextJoinId, joinPassword: nextJoinPassword };
    });
  }, [accessSalt, derivedState.selectedDestinationKey, onChange]);

  useEffect(() => {
    mobileStepButtonRefs.current.get(activeMobileStep)?.scrollIntoView?.({ block: "nearest", inline: "center" });
  }, [activeMobileStep]);

  function seedOwnerDisplayName() {
    onChange((current) => current.ownerDisplayName.trim() ? current : { ...current, ownerDisplayName: defaultOwnerDisplayName });
  }

  function regenerateCredentials() {
    const nextSalt = randomToken(3);
    setAccessSalt(nextSalt);
    onChange((current) => ({
      ...current,
      joinId: generateJoinIdForTrip(current.startDate, derivedState.selectedDestinationNames, nextSalt),
      joinPassword: generateJoinPassword(),
    }));
  }

  function updateDestinationCities(nextCities: TripCity[]) {
    onChange((current) => applyTripDestinationCities(current, nextCities));
    setCountryQuery("");
    setCityQuery("");
  }

  function selectDestinationCity(city: TripCityOption) {
    if (derivedState.selectedDestinationCities.some((selected) => selected.city.toLocaleLowerCase() === city.city.toLocaleLowerCase() && selected.countryCode === city.countryCode)) return;
    updateDestinationCities([...derivedState.selectedDestinationCities, tripCityFromOption(city)]);
  }

  function focusDestinationSearch() {
    destinationSearchRef.current?.focus();
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

  function addCityStop() {
    const nextCity = (countryQuery || cityQuery).trim();
    if (!nextCity || derivedState.selectedDestinationNames.some((name) => name.toLocaleLowerCase() === nextCity.toLocaleLowerCase())) return;
    updateDestinationCities([...derivedState.selectedDestinationCities, customTripCity(nextCity, derivedState.selectedDestinationCities[0])]);
  }

  function removeCityStop(cityName: string) {
    updateDestinationCities(derivedState.selectedDestinationCities.filter((city) => city.city !== cityName));
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

  function mobileStepClassName(stepId: TripWizardStepId, baseClassName = wizardStyles.tripStepSectionClassName) {
    return cn(baseClassName, activeMobileStep === stepId ? "" : "max-[767px]:hidden");
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
    addCityStop,
    changeOwnerDisplayName,
    cityQuery,
    clearTravelDates,
    copyJoinCode,
    countryQuery,
    destinationSearchRef,
    focusDestinationSearch,
    hasCopiedJoinCode,
    mobileStepButtonRefs,
    mobileStepClassName,
    regenerateCredentials,
    removeCityStop,
    selectCalendarDate,
    selectDestinationCity,
    selectingDateStep,
    setActiveMobileStep,
    setCityQuery,
    setCountryQuery,
    submitWizard,
    swapTravelDates,
    t,
    updateEndDate,
    updateStartDate,
    wizard,
  };
}

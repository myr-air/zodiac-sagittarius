"use client";

import { Dispatch, FormEvent, SetStateAction, useEffect, useRef, useState } from "react";
import type { AccountTripCreateRequest } from "@/src/account/api-client";
import type { TripCity } from "@/src/trip/types";
import { Badge } from "@/src/ui";
import { useI18n } from "@/src/i18n/I18nProvider";
import { cn } from "@/src/lib/cn";
import {
  customTripCity,
  destinationRouteCode,
  formatPreviewTravelDate,
  generateJoinIdForTrip,
  generateJoinPassword,
  randomToken,
  routeCalendarDays,
  tripCityFromOption,
  tripCountryOptions,
  tripDestinationCards,
  tripNightCount,
  tripStepComplete,
  tripWizardSteps,
  uniqueList,
  applyTripCalendarDate,
  applyTripDestinationCities,
  applyTripEndDate,
  applyTripStartDate,
  type TripCityOption,
  type TripWizardDateSelectionStep,
  type TripWizardStepId,
} from "./account-trip-wizard-support";
import {
  TripWizardDatesStep,
  TripWizardDestinationStep,
  TripWizardInviteStep,
  TripWizardReviewSummary,
} from "./portal-trip-wizard-form-sections";
import { PortalTripWizardActions } from "./portal-trip-wizard-actions";
import { TripWizardMobileStepActions, TripWizardWorkflowNav } from "./portal-trip-wizard-mobile-controls";
import { PortalTripWizardPreview } from "./portal-trip-wizard-preview";
import * as wizardStyles from "./portal-trip-wizard-styles";

export function PortalTripWizard({
  defaultOwnerDisplayName,
  isSubmitting,
  onChange,
  onSubmit,
  tripForm,
}: {
  defaultOwnerDisplayName: string;
  isSubmitting: boolean;
  onChange: Dispatch<SetStateAction<AccountTripCreateRequest>>;
  onSubmit: (form?: AccountTripCreateRequest) => void;
  tripForm: AccountTripCreateRequest;
}) {
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
  const ownerDisplayName = tripForm.ownerDisplayName;
  const effectiveOwnerDisplayName = hasEditedOwnerDisplayName ? ownerDisplayName : ownerDisplayName || defaultOwnerDisplayName;
  const selectedDestinationCities = tripForm.destinationCities;
  const selectedCountryNames = uniqueList(selectedDestinationCities.map((city) => city.country));
  const selectedCityNames = selectedDestinationCities.map((city) => city.city);
  const selectedDestinationNames = selectedCityNames;
  const selectedDestinationKey = selectedDestinationNames.join("|");
  const destinationComplete = selectedDestinationCities.length > 0;
  const datesComplete = Boolean(tripForm.startDate && tripForm.endDate);
  const generatedJoinId = generateJoinIdForTrip(tripForm.startDate, selectedDestinationNames, accessSalt);
  const generatedJoinPassword = tripForm.joinPassword.match(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/) ? tripForm.joinPassword : generateJoinPassword();
  const accessComplete = Boolean(effectiveOwnerDisplayName.trim() && generatedJoinId.trim() && generatedJoinPassword.match(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/));
  const canSubmit = Boolean(tripForm.name.trim()) && destinationComplete && datesComplete && accessComplete;
  const destinationSummary = selectedDestinationNames.length ? selectedDestinationNames.join(", ") : wizard.empty.destinationSummary;
  const currencySummary = selectedCountryNames.length ? uniqueList(selectedCountryNames.map((countryName) => tripCountryOptions.find((country) => country.name === countryName)?.currency ?? "").filter(Boolean)).join(", ") || wizard.empty.currencyByCity : wizard.empty.currency;
  const previewTripName = tripForm.name.trim() || wizard.empty.untitledTrip;
  const inviteStatus = accessComplete ? wizard.preview.inviteReady : wizard.preview.inviteDraft;
  const destinationCards = tripDestinationCards(selectedCountryNames, selectedCityNames, locale);
  const previewStartDate = formatPreviewTravelDate(tripForm.startDate);
  const previewEndDate = formatPreviewTravelDate(tripForm.endDate);
  const previewNightCount = tripNightCount(tripForm.startDate, tripForm.endDate, locale);
  const routeDestinationCode = destinationRouteCode(selectedDestinationNames);
  const joinCode = generatedJoinId;
  const calendarDays = routeCalendarDays(tripForm.startDate || "2026-06-01", tripForm.startDate, tripForm.endDate);
  const isMobilePreviewStep = activeMobileStep === "preview";
  const currentStepComplete = tripStepComplete(activeMobileStep, {
    accessComplete,
    datesComplete,
    destinationComplete,
    tripNameComplete: Boolean(tripForm.name.trim()),
  });
  const missingFields = [
    tripForm.name.trim() ? null : wizard.status.fields.trip,
    destinationComplete ? null : wizard.status.fields.destination,
    datesComplete ? null : wizard.status.fields.dates,
    accessComplete ? null : wizard.status.fields.invite,
  ].filter(Boolean).join(", ");
  const createStatusText = canSubmit ? wizard.status.ready : wizard.status.required({ fields: missingFields });

  useEffect(() => {
    onChange((current) => {
      const nextJoinId = generateJoinIdForTrip(current.startDate, selectedDestinationKey.split("|").filter(Boolean), accessSalt);
      const nextJoinPassword = current.joinPassword.match(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/) ? current.joinPassword : generateJoinPassword();
      if (current.joinId === nextJoinId && current.joinPassword === nextJoinPassword) return current;
      return { ...current, joinId: nextJoinId, joinPassword: nextJoinPassword };
    });
  }, [accessSalt, onChange, selectedDestinationKey]);

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
      joinId: generateJoinIdForTrip(current.startDate, selectedDestinationNames, nextSalt),
      joinPassword: generateJoinPassword(),
    }));
  }

  function updateDestinationCities(nextCities: TripCity[]) {
    onChange((current) => applyTripDestinationCities(current, nextCities));
    setCountryQuery("");
    setCityQuery("");
  }

  function selectDestinationCity(city: TripCityOption) {
    if (selectedDestinationCities.some((selected) => selected.city.toLocaleLowerCase() === city.city.toLocaleLowerCase() && selected.countryCode === city.countryCode)) return;
    updateDestinationCities([...selectedDestinationCities, tripCityFromOption(city)]);
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
    if (!nextCity || selectedDestinationNames.some((name) => name.toLocaleLowerCase() === nextCity.toLocaleLowerCase())) return;
    updateDestinationCities([...selectedDestinationCities, customTripCity(nextCity, selectedDestinationCities[0])]);
  }

  function removeCityStop(cityName: string) {
    updateDestinationCities(selectedDestinationCities.filter((city) => city.city !== cityName));
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
    const text = joinCode.trim();
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
    const nextForm = { ...tripForm, joinId: generatedJoinId, joinPassword: generatedJoinPassword };
    onChange(nextForm);
    if (canSubmit && !isSubmitting) onSubmit(nextForm);
  }

  return (
    <form className={cn(wizardStyles.accountSettingsFormClassName, wizardStyles.portalCreateTripInlineClassName)} aria-label={wizard.title} onSubmit={submitWizard}>
      <div className={wizardStyles.tripSimpleHeadClassName}>
        <div>
          <strong>{wizard.title} <Badge tone={canSubmit ? "success" : "neutral"}>{canSubmit ? wizard.statusReady : wizard.statusDraft}</Badge></strong>
          <p>{wizard.detail}</p>
        </div>
      </div>
      <TripWizardWorkflowNav
        activeMobileStep={activeMobileStep}
        mobileStepButtonRefs={mobileStepButtonRefs}
        onActiveMobileStepChange={setActiveMobileStep}
      />
      <div className={wizardStyles.tripWizardLayoutClassName}>
        <div className={cn(wizardStyles.tripWizardMainClassName, isMobilePreviewStep ? "max-[767px]:hidden" : "")}>
          <div className={wizardStyles.tripWizardPaneClassName}>
            <div className={wizardStyles.tripScopePanelClassName}>
              <section className={mobileStepClassName("trip")} role="region" aria-label={tripWizardSteps[0].regionLabel} data-mobile-active={activeMobileStep === "trip" ? "true" : "false"}>
                <div className={wizardStyles.tripStepHeadingClassName}>
                  <strong>{wizard.steps.trip.title}</strong>
                  <span>{wizard.steps.trip.detail}</span>
                </div>
                <label className={wizardStyles.tripNameFieldClassName}>
                  <span className="sr-only">{t.access.dashboard.createTrip.labels.name}</span>
                  <input
                    value={tripForm.name}
                    onChange={(event) => onChange((current) => ({ ...current, name: event.target.value }))}
                    placeholder={wizard.placeholders.tripName}
                    maxLength={100}
                    required
                  />
                  <small>{tripForm.name.length} / 100</small>
                </label>
              </section>

              <TripWizardDestinationStep
                activeMobileStep={activeMobileStep}
                cityQuery={cityQuery}
                countryQuery={countryQuery}
                destinationCards={destinationCards}
                destinationSearchRef={destinationSearchRef}
                mobileStepClassName={mobileStepClassName}
                onAddCityStop={addCityStop}
                onCityQueryChange={setCityQuery}
                onCountryQueryChange={setCountryQuery}
                onRemoveCityStop={removeCityStop}
                onSelectDestinationCity={selectDestinationCity}
                selectedCityNames={selectedCityNames}
                selectedDestinationCities={selectedDestinationCities}
                tripForm={tripForm}
                wizard={wizard}
              />

              <TripWizardDatesStep
                activeMobileStep={activeMobileStep}
                calendarDays={calendarDays}
                mobileStepClassName={mobileStepClassName}
                onChange={onChange}
                onClearTravelDates={clearTravelDates}
                onSelectCalendarDate={selectCalendarDate}
                onSwapTravelDates={swapTravelDates}
                onUpdateEndDate={updateEndDate}
                onUpdateStartDate={updateStartDate}
                previewEndDate={previewEndDate}
                previewStartDate={previewStartDate}
                selectedDestinationCities={selectedDestinationCities}
                selectingDateStep={selectingDateStep}
                t={t}
                tripForm={tripForm}
                wizard={wizard}
              />

              <TripWizardInviteStep
                activeMobileStep={activeMobileStep}
                defaultOwnerDisplayName={defaultOwnerDisplayName}
                effectiveOwnerDisplayName={effectiveOwnerDisplayName}
                generatedJoinId={generatedJoinId}
                generatedJoinPassword={generatedJoinPassword}
                mobileStepClassName={mobileStepClassName}
                onOwnerDisplayNameChange={(value) => {
                  setHasEditedOwnerDisplayName(true);
                  onChange((current) => ({ ...current, ownerDisplayName: value }));
                }}
                onRegenerateCredentials={regenerateCredentials}
                t={t}
                wizard={wizard}
              />

              <TripWizardReviewSummary
                destinationSummary={destinationSummary}
                tripForm={tripForm}
                wizard={wizard}
              />
            </div>
          </div>
        </div>
        <PortalTripWizardPreview
          activeMobileStep={activeMobileStep}
          canSubmit={canSubmit}
          currencySummary={currencySummary}
          destinationCards={destinationCards}
          destinationCities={selectedDestinationCities}
          hasCopiedJoinCode={hasCopiedJoinCode}
          inviteStatus={inviteStatus}
          joinCode={joinCode}
          onCopyJoinCode={() => void copyJoinCode()}
          onFocusDestinationSearch={focusDestinationSearch}
          previewEndDate={previewEndDate}
          previewNightCount={previewNightCount}
          previewStartDate={previewStartDate}
          previewTripName={previewTripName}
          routeDestinationCode={routeDestinationCode}
          selectedCityNames={selectedCityNames}
          tripForm={tripForm}
        />
      </div>
      <TripWizardMobileStepActions
        activeMobileStep={activeMobileStep}
        currentStepComplete={currentStepComplete}
        onActiveMobileStepChange={setActiveMobileStep}
      />
      <PortalTripWizardActions
        canSubmit={canSubmit}
        cancelLabel={wizard.actions.cancel}
        createLabel={wizard.actions.create}
        createStatusText={createStatusText}
        creatingLabel={wizard.actions.creating}
        destinationSummary={destinationSummary}
        isSubmitting={isSubmitting}
        previewEndDate={previewEndDate}
        previewNightCount={previewNightCount}
        previewStartDate={previewStartDate}
        previewTripName={previewTripName}
      />
    </form>
  );
}

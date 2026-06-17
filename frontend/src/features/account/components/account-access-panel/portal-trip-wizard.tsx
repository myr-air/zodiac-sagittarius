"use client";

import { Dispatch, FormEvent, SetStateAction, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { AccountTripCreateRequest } from "@/src/account/api-client";
import { appRoutes } from "@/src/trip/workspace/sagittarius-app/support";
import type { TripCity } from "@/src/trip/types";
import { Badge, Button } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
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
  type TripCityOption,
  type TripWizardStepId,
} from "./account-trip-wizard-support";
import { TripWizardDatesStep, TripWizardDestinationStep } from "./portal-trip-wizard-form-sections";
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
  const [selectingDateStep, setSelectingDateStep] = useState<"depart" | "return">("depart");
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
    const nextCountries = uniqueList(nextCities.map((city) => city.country));
    onChange((current) => ({
      ...current,
      countries: nextCountries,
      destinationCities: nextCities,
      destinationLabel: nextCities.map((city) => city.city).join(", "),
    }));
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
    onChange((current) => {
      if (!date || !current.endDate) return { ...current, startDate: date };
      if (Date.parse(`${date}T00:00:00`) > Date.parse(`${current.endDate}T00:00:00`)) {
        return { ...current, startDate: current.endDate, endDate: date };
      }
      return { ...current, startDate: date };
    });
  }

  function updateEndDate(date: string) {
    onChange((current) => {
      if (!date || !current.startDate) return { ...current, endDate: date };
      if (Date.parse(`${date}T00:00:00`) < Date.parse(`${current.startDate}T00:00:00`)) {
        return { ...current, startDate: date, endDate: current.startDate };
      }
      return { ...current, endDate: date };
    });
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
    if (selectingDateStep === "depart") {
      onChange((current) => ({ ...current, startDate: date, endDate: Date.parse(`${current.endDate}T00:00:00`) < Date.parse(`${date}T00:00:00`) ? date : current.endDate }));
      setSelectingDateStep("return");
      return;
    }
    onChange((current) => {
      if (current.startDate && Date.parse(`${date}T00:00:00`) < Date.parse(`${current.startDate}T00:00:00`)) {
        return { ...current, startDate: date, endDate: current.startDate };
      }
      return { ...current, endDate: date };
    });
    setSelectingDateStep("depart");
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

              <section className={mobileStepClassName("invite", wizardStyles.tripStepSectionCompactClassName)} role="region" aria-label={tripWizardSteps[3].regionLabel} data-mobile-active={activeMobileStep === "invite" ? "true" : "false"}>
                <details className={wizardStyles.tripAccessPanelClassName} {...(activeMobileStep === "invite" ? { open: true } : {})}>
                  <summary>
                    <span>{wizard.steps.invite.title}</span>
                    <strong>{effectiveOwnerDisplayName || defaultOwnerDisplayName}</strong>
                  </summary>
                  <label>
                    <span>{t.access.dashboard.createTrip.labels.ownerDisplayName}</span>
                    <input
                      value={effectiveOwnerDisplayName}
                      onChange={(event) => {
                        setHasEditedOwnerDisplayName(true);
                        onChange((current) => ({ ...current, ownerDisplayName: event.target.value }));
                      }}
                      autoComplete="name"
                      required
                    />
                    <small>{wizard.helper.ownerDefault}</small>
                  </label>
                  <div className={wizardStyles.tripGeneratedAccessClassName}>
                    <label>
                      <span>{t.access.dashboard.createTrip.labels.joinId}</span>
                      <input value={generatedJoinId} readOnly />
                      <small>{wizard.helper.joinIdHint}</small>
                    </label>
                    <label>
                      <span>{t.access.dashboard.createTrip.labels.joinPassword}</span>
                      <input value={generatedJoinPassword} readOnly />
                    </label>
                    <Button type="button" variant="secondary" onClick={regenerateCredentials}>
                      <Icon name="route" />
                      {wizard.actions.regenerate}
                    </Button>
                  </div>
                </details>
              </section>

              <div className={wizardStyles.tripAccessNoteClassName}>
                <Icon name="key" />
                <span>{wizard.helper.postCreateEditable}</span>
              </div>
              <div className={wizardStyles.tripTicketReviewClassName}>
                <div>
                  <span>{wizard.review.trip}</span>
                  <strong>{tripForm.name || wizard.empty.newTrip}</strong>
                </div>
                <div>
                  <span>{wizard.review.destinations}</span>
                  <strong>{destinationSummary}</strong>
                </div>
                <div>
                  <span>{wizard.review.dates}</span>
                  <strong>{tripForm.startDate && tripForm.endDate ? `${tripForm.startDate} - ${tripForm.endDate}` : wizard.empty.missingDates}</strong>
                </div>
              </div>
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
      <div className={wizardStyles.tripWizardActionsClassName} role="group" aria-label="Create trip status">
        <p className={wizardStyles.tripWizardActionStatusClassName}>
          <Icon name={canSubmit ? "check" : "key"} />
          {createStatusText}
        </p>
        <div className={wizardStyles.tripWizardActionSummaryClassName} aria-hidden="true">
          <strong>{previewTripName}</strong>
          <span>{destinationSummary}</span>
          <span>{previewStartDate} - {previewEndDate} · {previewNightCount}</span>
        </div>
        <div className={wizardStyles.tripWizardActionButtonsClassName}>
          <Button asChild type="button" variant="secondary">
            <Link href={appRoutes.portalMyTrips()}>
              <Icon name="chevronLeft" />
              {wizard.actions.cancel}
            </Link>
          </Button>
          <Button type="submit" disabled={isSubmitting || !canSubmit}>
            <Icon name="check" />
            {isSubmitting ? wizard.actions.creating : wizard.actions.create}
          </Button>
        </div>
      </div>
    </form>
  );
}

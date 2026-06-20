"use client";

import { type Dispatch, type SetStateAction } from "react";
import type { AccountTripCreateRequest } from "@/src/account/api-client";
import { Badge } from "@/src/ui";
import { cn } from "@/src/lib/cn";
import {
  TripWizardDatesStep,
  TripWizardDestinationStep,
  TripWizardInviteStep,
  TripWizardReviewSummary,
  TripWizardTripStep,
} from "./portal-trip-wizard-form-sections";
import { PortalTripWizardActions } from "./portal-trip-wizard-actions";
import { TripWizardMobileStepActions, TripWizardWorkflowNav } from "./portal-trip-wizard-mobile-controls";
import { PortalTripWizardPreview } from "./portal-trip-wizard-preview";
import * as wizardStyles from "./portal-trip-wizard-styles";
import { usePortalTripWizardModel } from "./use-portal-trip-wizard-model";

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
  const wizardModel = usePortalTripWizardModel({
    defaultOwnerDisplayName,
    isSubmitting,
    onChange,
    onSubmit,
    tripForm,
  });
  const {
    activeMobileStep,
    addCityStop,
    calendarDays,
    canSubmit,
    changeOwnerDisplayName,
    cityQuery,
    clearTravelDates,
    copyJoinCode,
    countryQuery,
    createStatusText,
    currencySummary,
    currentStepComplete,
    destinationCards,
    destinationSearchRef,
    destinationSummary,
    effectiveOwnerDisplayName,
    focusDestinationSearch,
    generatedJoinId,
    generatedJoinPassword,
    hasCopiedJoinCode,
    inviteStatus,
    isMobilePreviewStep,
    joinCode,
    mobileStepButtonRefs,
    mobileStepClassName,
    previewEndDate,
    previewNightCount,
    previewStartDate,
    previewTripName,
    regenerateCredentials,
    removeCityStop,
    routeDestinationCode,
    selectCalendarDate,
    selectDestinationCity,
    selectedCityNames,
    selectedDestinationCities,
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
  } = wizardModel;

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
              <TripWizardTripStep
                activeMobileStep={activeMobileStep}
                mobileStepClassName={mobileStepClassName}
                nameLabel={t.access.dashboard.createTrip.labels.name}
                tripForm={tripForm}
                wizard={wizard}
                onTripNameChange={(name) => onChange((current) => ({ ...current, name }))}
              />

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
                onOwnerDisplayNameChange={changeOwnerDisplayName}
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

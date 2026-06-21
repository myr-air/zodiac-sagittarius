import type { Dispatch, SetStateAction } from "react";
import type { AccountTripCreateRequest } from "@/src/account/api-client";
import { cn } from "@/src/lib/cn";
import {
  TripWizardDatesStep,
  TripWizardDestinationStep,
  TripWizardInviteStep,
  TripWizardReviewSummary,
  TripWizardTripStep,
} from "./steps/portal-trip-wizard-form-sections";
import * as wizardStyles from "./layout/portal-trip-wizard-styles";
import type { PortalTripWizardModel } from "./state/use-portal-trip-wizard-model";

interface PortalTripWizardMainPanelProps {
  defaultOwnerDisplayName: string;
  isMobilePreviewStep: boolean;
  onChange: Dispatch<SetStateAction<AccountTripCreateRequest>>;
  tripForm: AccountTripCreateRequest;
  wizardModel: PortalTripWizardModel;
}

export function PortalTripWizardMainPanel({
  defaultOwnerDisplayName,
  isMobilePreviewStep,
  onChange,
  tripForm,
  wizardModel,
}: PortalTripWizardMainPanelProps) {
  return (
    <div className={cn(wizardStyles.tripWizardMainClassName, isMobilePreviewStep ? "max-[767px]:hidden" : "")}>
      <div className={wizardStyles.tripWizardPaneClassName}>
        <div className={wizardStyles.tripScopePanelClassName}>
          <TripWizardTripStep
            activeMobileStep={wizardModel.activeMobileStep}
            mobileStepClassName={wizardModel.mobileStepClassName}
            nameLabel={wizardModel.t.access.dashboard.createTrip.labels.name}
            tripForm={tripForm}
            wizard={wizardModel.wizard}
            onTripNameChange={(name) => onChange((current) => ({ ...current, name }))}
          />

          <TripWizardDestinationStep
            activeMobileStep={wizardModel.activeMobileStep}
            cityQuery={wizardModel.cityQuery}
            countryQuery={wizardModel.countryQuery}
            destinationCards={wizardModel.destinationCards}
            destinationSearchRef={wizardModel.destinationSearchRef}
            mobileStepClassName={wizardModel.mobileStepClassName}
            onAddCityStop={wizardModel.addCityStop}
            onCityQueryChange={wizardModel.setCityQuery}
            onCountryQueryChange={wizardModel.setCountryQuery}
            onRemoveCityStop={wizardModel.removeCityStop}
            onSelectDestinationCity={wizardModel.selectDestinationCity}
            selectedCityNames={wizardModel.selectedCityNames}
            selectedDestinationCities={wizardModel.selectedDestinationCities}
            tripForm={tripForm}
            wizard={wizardModel.wizard}
          />

          <TripWizardDatesStep
            activeMobileStep={wizardModel.activeMobileStep}
            calendarDays={wizardModel.calendarDays}
            mobileStepClassName={wizardModel.mobileStepClassName}
            onChange={onChange}
            onClearTravelDates={wizardModel.clearTravelDates}
            onSelectCalendarDate={wizardModel.selectCalendarDate}
            onSwapTravelDates={wizardModel.swapTravelDates}
            onUpdateEndDate={wizardModel.updateEndDate}
            onUpdateStartDate={wizardModel.updateStartDate}
            previewEndDate={wizardModel.previewEndDate}
            previewStartDate={wizardModel.previewStartDate}
            selectedDestinationCities={wizardModel.selectedDestinationCities}
            selectingDateStep={wizardModel.selectingDateStep}
            t={wizardModel.t}
            tripForm={tripForm}
            wizard={wizardModel.wizard}
          />

          <TripWizardInviteStep
            activeMobileStep={wizardModel.activeMobileStep}
            defaultOwnerDisplayName={defaultOwnerDisplayName}
            effectiveOwnerDisplayName={wizardModel.effectiveOwnerDisplayName}
            generatedJoinId={wizardModel.generatedJoinId}
            generatedJoinPassword={wizardModel.generatedJoinPassword}
            mobileStepClassName={wizardModel.mobileStepClassName}
            onOwnerDisplayNameChange={wizardModel.changeOwnerDisplayName}
            onRegenerateCredentials={wizardModel.regenerateCredentials}
            t={wizardModel.t}
            wizard={wizardModel.wizard}
          />

          <TripWizardReviewSummary
            destinationSummary={wizardModel.destinationSummary}
            tripForm={tripForm}
            wizard={wizardModel.wizard}
          />
        </div>
      </div>
    </div>
  );
}

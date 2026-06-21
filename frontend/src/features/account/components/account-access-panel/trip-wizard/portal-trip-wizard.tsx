"use client";

import { type Dispatch, type SetStateAction } from "react";
import type { AccountTripCreateRequest } from "@/src/account/api-client";
import { Badge } from "@/src/ui";
import { cn } from "@/src/lib/cn";
import { PortalTripWizardActions } from "./portal-trip-wizard-actions";
import { PortalTripWizardMainPanel } from "./portal-trip-wizard-main-panel";
import { TripWizardMobileStepActions, TripWizardWorkflowNav } from "./portal-trip-wizard-mobile-controls";
import { PortalTripWizardPreview } from "./portal-trip-wizard-preview";
import * as wizardStyles from "./layout/portal-trip-wizard-styles";
import { usePortalTripWizardModel } from "./state/use-portal-trip-wizard-model";

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
    canSubmit,
    copyJoinCode,
    createStatusText,
    currencySummary,
    currentStepComplete,
    destinationCards,
    destinationSummary,
    focusDestinationSearch,
    hasCopiedJoinCode,
    inviteStatus,
    isMobilePreviewStep,
    joinCode,
    mobileStepButtonRefs,
    previewEndDate,
    previewNightCount,
    previewStartDate,
    previewTripName,
    routeDestinationCode,
    selectedCityNames,
    selectedDestinationCities,
    setActiveMobileStep,
    submitWizard,
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
        <PortalTripWizardMainPanel
          defaultOwnerDisplayName={defaultOwnerDisplayName}
          isMobilePreviewStep={isMobilePreviewStep}
          onChange={onChange}
          tripForm={tripForm}
          wizardModel={wizardModel}
        />
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

"use client";

import type { AccountTripCreateRequest } from "@/src/account/api-client";
import type { TripCity } from "@/src/trip/types";
import { Badge, Button, FloatingActionButton } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import { useI18n } from "@/src/i18n/I18nProvider";
import { cn } from "@/src/lib/cn";
import {
  destinationRouteCode,
  tripCityFromFormOrigin,
  type TripDestinationCard,
} from "../model/account-trip-destinations";
import { tripWizardSteps, type TripWizardStepId } from "../model/account-trip-wizard-steps";
import { DestinationCardMeta } from "../steps/destination-card-meta";
import { TripPreviewLiveMap } from "../map";
import * as wizardStyles from "../layout/portal-trip-wizard-styles";

interface PortalTripWizardPreviewProps {
  activeMobileStep: TripWizardStepId;
  canSubmit: boolean;
  currencySummary: string;
  destinationCards: TripDestinationCard[];
  destinationCities: TripCity[];
  hasCopiedJoinCode: boolean;
  inviteStatus: string;
  joinCode: string;
  onCopyJoinCode: () => void;
  onFocusDestinationSearch: () => void;
  previewEndDate: string;
  previewNightCount: string;
  previewStartDate: string;
  previewTripName: string;
  routeDestinationCode: string;
  selectedCityNames: string[];
  tripForm: AccountTripCreateRequest;
}

export function PortalTripWizardPreview({
  activeMobileStep,
  canSubmit,
  currencySummary,
  destinationCards,
  destinationCities,
  hasCopiedJoinCode,
  inviteStatus,
  joinCode,
  onCopyJoinCode,
  onFocusDestinationSearch,
  previewEndDate,
  previewNightCount,
  previewStartDate,
  previewTripName,
  routeDestinationCode,
  selectedCityNames,
  tripForm,
}: PortalTripWizardPreviewProps) {
  const { t } = useI18n();
  const wizard = t.access.dashboard.createTrip.wizard;
  const isMobilePreviewStep = activeMobileStep === "preview";

  return (
    <aside className={cn(wizardStyles.tripLivePreviewClassName, isMobilePreviewStep ? "" : "max-[767px]:hidden")} role="region" aria-label="Live trip preview">
      <section className={cn("trip-preview-step grid", activeMobileStep === "preview" ? "" : "max-[767px]:hidden")} role="region" aria-label={tripWizardSteps[4].regionLabel} data-mobile-active={activeMobileStep === "preview" ? "true" : "false"}>
        <div className={wizardStyles.tripBoardingPassClassName}>
          <div className={wizardStyles.tripMainTicketClassName}>
            <div className={wizardStyles.tripPreviewTicketTopClassName}>
              <span>{wizard.preview.label}</span>
            </div>
            <strong>{previewTripName}</strong>
            <p>{wizard.preview.tripId}: TRP-26-0001 <Badge tone={canSubmit ? "success" : "neutral"}>{canSubmit ? wizard.statusReady : wizard.statusDraft}</Badge></p>
            <div className={wizardStyles.tripFlightRouteClassName}>
              <div>
                <strong>{destinationRouteCode([tripForm.originCity])}</strong>
                <span>{tripForm.originCity}</span>
              </div>
              <span className={wizardStyles.tripFlightLineClassName}><Icon name="route" /></span>
              <div>
                <strong>{routeDestinationCode}</strong>
                <span>{selectedCityNames[0] ?? wizard.empty.destination}</span>
              </div>
            </div>
            <TripPreviewLiveMap originCity={tripCityFromFormOrigin(tripForm)} destinationCities={destinationCities} />
            <div className={wizardStyles.tripPreviewDestinationRowClassName}>
              <span>{wizard.preview.destinations}</span>
              <div>
                {destinationCards.map((card) => (
                  <article key={card.title} className={wizardStyles.tripPreviewDestinationCardClassName}>
                    <strong>{card.title}</strong>
                    <DestinationCardMeta detail={card.detail} meta={card.meta} />
                    <Badge tone="primary">{card.nights}</Badge>
                  </article>
                ))}
                <FloatingActionButton className={cn(wizardStyles.tripMiniAddClassName, "static")} type="button" onClick={onFocusDestinationSearch}>
                  <Icon name="plus" />
                  {wizard.actions.addDestination}
                </FloatingActionButton>
              </div>
            </div>
          </div>
          <div className={wizardStyles.tripTicketStubClassName}>
            <Icon name="route" />
            <div>
              <strong>{previewStartDate} - {previewEndDate}</strong>
              <span>{previewNightCount}</span>
            </div>
            <div>
              <span>{wizard.preview.currency}</span>
              <strong>{currencySummary}</strong>
            </div>
            <div>
              <span>{wizard.preview.status}</span>
              <Badge tone={canSubmit ? "warning" : "neutral"}>{inviteStatus}</Badge>
            </div>
          </div>
        </div>
      </section>
      <div className={cn(wizardStyles.tripShareStripClassName, "max-[767px]:hidden")}>
        <span><Icon name="users" /> {wizard.preview.shareCode}</span>
        <span>{wizard.preview.joinCode} <strong>{joinCode}</strong></span>
        <Button type="button" variant="secondary" onClick={onCopyJoinCode}>
          {hasCopiedJoinCode ? wizard.actions.copied : wizard.actions.copy}
        </Button>
        <span><Icon name="key" /> {wizard.preview.shareLinkPending}</span>
      </div>
    </aside>
  );
}

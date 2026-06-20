"use client";

import { Icon } from "@/src/ui/icons";
import { tripDestinationCards } from "./account-trip-destinations";
import { DestinationCardMeta } from "./destination-card-meta";
import * as wizardStyles from "./portal-trip-wizard-styles";

interface TripWizardSelectedDestinationsProps {
  destinationCards: ReturnType<typeof tripDestinationCards>;
  emptyLabel: string;
  selectedCityNames: string[];
  onRemoveCityStop: (cityName: string) => void;
}

export function TripWizardSelectedDestinations({
  destinationCards,
  emptyLabel,
  onRemoveCityStop,
  selectedCityNames,
}: TripWizardSelectedDestinationsProps) {
  if (!selectedCityNames.length) {
    return (
      <div className={wizardStyles.tripSelectedCountriesClassName} aria-label="Selected destinations">
        <span>{emptyLabel}</span>
      </div>
    );
  }

  return (
    <div className={wizardStyles.tripFormDestinationRowClassName} aria-label="Selected destinations">
      {destinationCards.map((card) => (
        <article key={card.title} className={wizardStyles.tripMiniDestinationClassName}>
          <span className={wizardStyles.tripPlaceThumbClassName} aria-hidden="true" />
          <div>
            <strong>{card.title}</strong>
            <DestinationCardMeta detail={card.detail} meta={card.meta} />
          </div>
          <button type="button" aria-label={`Remove ${card.title}`} onClick={() => onRemoveCityStop(card.title)}>
            <Icon name="x" />
          </button>
        </article>
      ))}
    </div>
  );
}

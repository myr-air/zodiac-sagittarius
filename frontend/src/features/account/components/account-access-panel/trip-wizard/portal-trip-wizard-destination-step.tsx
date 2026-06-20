"use client";

import type { RefObject } from "react";
import type { AccountTripCreateRequest } from "@/src/account/api-client";
import type { TripCity } from "@/src/trip/types";
import { Button } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import {
  citySuggestions,
  tripDestinationCards,
  type TripCityOption,
} from "./account-trip-destinations";
import { tripWizardSteps } from "./account-trip-wizard-steps";
import { TripWizardSelectedDestinations } from "./portal-trip-wizard-selected-destinations";
import * as wizardStyles from "./portal-trip-wizard-styles";

interface TripWizardDestinationStepProps {
  activeMobileStep: string;
  cityQuery: string;
  countryQuery: string;
  destinationCards: ReturnType<typeof tripDestinationCards>;
  destinationSearchRef: RefObject<HTMLInputElement | null>;
  mobileStepClassName: (stepId: "place") => string;
  selectedCityNames: string[];
  selectedDestinationCities: TripCity[];
  wizard: {
    actions: {
      addCity: string;
    };
    empty: {
      selectedDestinations: string;
    };
    fields: {
      addCityManually: string;
      addCityOrStop: string;
      originCity: string;
      searchDestinationCities: string;
    };
    placeholders: {
      destinationSearch: string;
      manualCity: string;
    };
    steps: {
      place: {
        detail: string;
        title: string;
      };
    };
  };
  tripForm: AccountTripCreateRequest;
  onAddCityStop: () => void;
  onCityQueryChange: (value: string) => void;
  onCountryQueryChange: (value: string) => void;
  onRemoveCityStop: (cityName: string) => void;
  onSelectDestinationCity: (city: TripCityOption) => void;
}

export function TripWizardDestinationStep({
  activeMobileStep,
  cityQuery,
  countryQuery,
  destinationCards,
  destinationSearchRef,
  mobileStepClassName,
  onAddCityStop,
  onCityQueryChange,
  onCountryQueryChange,
  onRemoveCityStop,
  onSelectDestinationCity,
  selectedCityNames,
  selectedDestinationCities,
  tripForm,
  wizard,
}: TripWizardDestinationStepProps) {
  const suggestedCities = citySuggestions(cityQuery || countryQuery, selectedDestinationCities);

  return (
    <section className={mobileStepClassName("place")} role="region" aria-label={tripWizardSteps[1].regionLabel} data-mobile-active={activeMobileStep === "place" ? "true" : "false"}>
      <div className={wizardStyles.tripStepHeadingClassName}>
        <strong>{wizard.steps.place.title}</strong>
        <span>{wizard.steps.place.detail}</span>
      </div>
      <div className={wizardStyles.tripCountryPickerClassName}>
        <label className={wizardStyles.tripCountrySearchClassName}>
          <span>{wizard.fields.originCity}</span>
          <input aria-label={wizard.fields.originCity} value={tripForm.originLabel} readOnly />
        </label>
        <div className={wizardStyles.tripCountrySearchClassName}>
          <label>
            <span className="sr-only">{wizard.fields.searchDestinationCities}</span>
            <input
              aria-label={wizard.fields.searchDestinationCities}
              ref={destinationSearchRef}
              value={cityQuery}
              onChange={(event) => onCityQueryChange(event.target.value)}
              placeholder={wizard.placeholders.destinationSearch}
            />
          </label>
          {suggestedCities.length ? (
            <div className={wizardStyles.tripCountrySuggestionsClassName} aria-label="Destination city suggestions">
              {suggestedCities.map((city) => (
                <button type="button" key={`${city.city}-${city.countryCode}`} aria-label={`${city.city}, ${city.country}`} onClick={() => onSelectDestinationCity(city)}>
                  <strong>{city.city}</strong>
                  <span>{city.country} · {city.countryCode} · {city.timezone}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <TripWizardSelectedDestinations
          destinationCards={destinationCards}
          emptyLabel={wizard.empty.selectedDestinations}
          selectedCityNames={selectedCityNames}
          onRemoveCityStop={onRemoveCityStop}
        />
        <div className={wizardStyles.tripCityEntryClassName}>
          <label>
            <span>{wizard.fields.addCityManually}</span>
            <input
              aria-label={wizard.fields.addCityOrStop}
              value={countryQuery}
              onChange={(event) => onCountryQueryChange(event.target.value)}
              placeholder={wizard.placeholders.manualCity}
            />
          </label>
          <Button type="button" variant="secondary" onClick={onAddCityStop} disabled={!countryQuery.trim()}>
            <Icon name="plus" />
            {wizard.actions.addCity}
          </Button>
        </div>
      </div>
    </section>
  );
}

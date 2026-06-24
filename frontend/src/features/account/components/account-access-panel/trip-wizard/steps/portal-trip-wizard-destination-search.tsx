"use client";

import type { RefObject } from "react";
import type { TripCity } from "@/src/trip/types";
import {
  citySuggestions,
  type TripCityOption,
} from "../model/account-trip-destinations";
import * as wizardStyles from "../layout/portal-trip-wizard-styles";

interface TripWizardDestinationSearchProps {
  cityQuery: string;
  destinationSearchRef: RefObject<HTMLInputElement | null>;
  originLabel: string;
  selectedDestinationCities: TripCity[];
  suggestionQuery: string;
  wizard: {
    fields: {
      originCity: string;
      searchDestinationCities: string;
    };
    placeholders: {
      destinationSearch: string;
    };
  };
  onCityQueryChange: (value: string) => void;
  onSelectDestinationCity: (city: TripCityOption) => void;
}

export function TripWizardDestinationSearch({
  cityQuery,
  destinationSearchRef,
  onCityQueryChange,
  onSelectDestinationCity,
  originLabel,
  selectedDestinationCities,
  suggestionQuery,
  wizard,
}: TripWizardDestinationSearchProps) {
  const suggestedCities = citySuggestions(suggestionQuery, selectedDestinationCities);

  return (
    <>
      <label className={wizardStyles.tripCountrySearchClassName}>
        <span>{wizard.fields.originCity}</span>
        <input aria-label={wizard.fields.originCity} value={originLabel} readOnly />
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
    </>
  );
}

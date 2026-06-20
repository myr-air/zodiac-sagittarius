"use client";

import type { RefObject } from "react";
import type { AccountTripCreateRequest } from "@/src/account/api-client";
import type { TripCity } from "@/src/trip/types";
import {
  tripDestinationCards,
  type TripCityOption,
} from "./account-trip-destinations";
import { tripWizardSteps } from "./account-trip-wizard-steps";
import { TripWizardDestinationSearch } from "./portal-trip-wizard-destination-search";
import { TripWizardManualCityEntry } from "./portal-trip-wizard-manual-city-entry";
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
  return (
    <section className={mobileStepClassName("place")} role="region" aria-label={tripWizardSteps[1].regionLabel} data-mobile-active={activeMobileStep === "place" ? "true" : "false"}>
      <div className={wizardStyles.tripStepHeadingClassName}>
        <strong>{wizard.steps.place.title}</strong>
        <span>{wizard.steps.place.detail}</span>
      </div>
      <div className={wizardStyles.tripCountryPickerClassName}>
        <TripWizardDestinationSearch
          cityQuery={cityQuery}
          destinationSearchRef={destinationSearchRef}
          originLabel={tripForm.originLabel}
          selectedDestinationCities={selectedDestinationCities}
          suggestionQuery={cityQuery || countryQuery}
          wizard={wizard}
          onCityQueryChange={onCityQueryChange}
          onSelectDestinationCity={onSelectDestinationCity}
        />
        <TripWizardSelectedDestinations
          destinationCards={destinationCards}
          emptyLabel={wizard.empty.selectedDestinations}
          selectedCityNames={selectedCityNames}
          onRemoveCityStop={onRemoveCityStop}
        />
        <TripWizardManualCityEntry
          countryQuery={countryQuery}
          wizard={wizard}
          onAddCityStop={onAddCityStop}
          onCountryQueryChange={onCountryQueryChange}
        />
      </div>
    </section>
  );
}

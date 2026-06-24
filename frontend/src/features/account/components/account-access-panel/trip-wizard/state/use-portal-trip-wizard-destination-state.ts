import { type Dispatch, type SetStateAction, useRef, useState } from "react";
import type { AccountTripCreateRequest } from "@/src/account/api-client";
import {
  normalizeSearchQuery,
  textEqualsNormalizedQuery,
} from "@/src/shared/text-search";
import type { TripCity } from "@/src/trip/types";
import { applyTripDestinationCities } from "../model/account-trip-form";
import {
  customTripCity,
  tripCityFromOption,
  type TripCityOption,
} from "../model/account-trip-destinations";

interface PortalTripWizardDestinationStateOptions {
  onChange: Dispatch<SetStateAction<AccountTripCreateRequest>>;
  selectedDestinationCities: TripCity[];
  selectedDestinationNames: string[];
}

export function usePortalTripWizardDestinationState({
  onChange,
  selectedDestinationCities,
  selectedDestinationNames,
}: PortalTripWizardDestinationStateOptions) {
  const [countryQuery, setCountryQuery] = useState("");
  const [cityQuery, setCityQuery] = useState("");
  const destinationSearchRef = useRef<HTMLInputElement | null>(null);

  function updateDestinationCities(nextCities: TripCity[]) {
    onChange((current) => applyTripDestinationCities(current, nextCities));
    setCountryQuery("");
    setCityQuery("");
  }

  function selectDestinationCity(city: TripCityOption) {
    const normalizedCity = normalizeSearchQuery(city.city);
    const alreadySelected = selectedDestinationCities.some((selected) =>
      textEqualsNormalizedQuery(selected.city, normalizedCity)
      && selected.countryCode === city.countryCode
    );
    if (alreadySelected) return;
    updateDestinationCities([...selectedDestinationCities, tripCityFromOption(city)]);
  }

  function focusDestinationSearch() {
    destinationSearchRef.current?.focus();
  }

  function addCityStop() {
    const nextCity = (countryQuery || cityQuery).trim();
    const normalizedNextCity = normalizeSearchQuery(nextCity);
    const hasSelectedCity = selectedDestinationNames.some((name) =>
      textEqualsNormalizedQuery(name, normalizedNextCity)
    );
    if (!nextCity || hasSelectedCity) return;
    updateDestinationCities([
      ...selectedDestinationCities,
      customTripCity(nextCity, selectedDestinationCities[0]),
    ]);
  }

  function removeCityStop(cityName: string) {
    updateDestinationCities(selectedDestinationCities.filter((city) => city.city !== cityName));
  }

  return {
    addCityStop,
    cityQuery,
    countryQuery,
    destinationSearchRef,
    focusDestinationSearch,
    removeCityStop,
    selectDestinationCity,
    setCityQuery,
    setCountryQuery,
  };
}

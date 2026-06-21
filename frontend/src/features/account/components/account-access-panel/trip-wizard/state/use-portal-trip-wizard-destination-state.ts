import { type Dispatch, type SetStateAction, useRef, useState } from "react";
import type { AccountTripCreateRequest } from "@/src/account/api-client";
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
    const alreadySelected = selectedDestinationCities.some((selected) =>
      selected.city.toLocaleLowerCase() === city.city.toLocaleLowerCase()
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
    const hasSelectedCity = selectedDestinationNames.some((name) =>
      name.toLocaleLowerCase() === nextCity.toLocaleLowerCase()
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

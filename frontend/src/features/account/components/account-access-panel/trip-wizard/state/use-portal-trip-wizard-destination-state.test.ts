import { act, renderHook } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import type { TripCity } from "@/src/trip/types";
import {
  applyTripDestinationCities,
  defaultTripForm,
} from "../model/account-trip-form";
import { tripCityOptions } from "../model/account-trip-destinations";
import { usePortalTripWizardDestinationState } from "./use-portal-trip-wizard-destination-state";

function useDestinationStateHarness(initialCities: TripCity[] = []) {
  const [form, setForm] = useState(() => applyTripDestinationCities(defaultTripForm(), initialCities));
  const destinationState = usePortalTripWizardDestinationState({
    onChange: setForm,
    selectedDestinationCities: form.destinationCities,
    selectedDestinationNames: form.destinationCities.map((city) => city.city),
  });
  return { destinationState, form };
}

describe("usePortalTripWizardDestinationState", () => {
  it("selects known destination cities and ignores exact duplicates", () => {
    const tokyo = tripCityOptions.find((city) => city.city === "Tokyo");
    if (!tokyo) throw new Error("Tokyo fixture is missing");

    const { result } = renderHook(() => useDestinationStateHarness());

    act(() => result.current.destinationState.selectDestinationCity(tokyo));
    act(() => result.current.destinationState.selectDestinationCity(tokyo));

    expect(result.current.form.destinationCities).toHaveLength(1);
    expect(result.current.form.destinationCities[0]).toMatchObject({
      city: "Tokyo",
      country: "Japan",
      countryCode: "JP",
    });
  });

  it("adds custom stops with the first selected city fallback and clears destination queries", () => {
    const tokyo = tripCityOptions.find((city) => city.city === "Tokyo");
    if (!tokyo) throw new Error("Tokyo fixture is missing");
    const { result } = renderHook(() => useDestinationStateHarness([tokyo]));

    act(() => {
      result.current.destinationState.setCountryQuery("Narnia");
      result.current.destinationState.setCityQuery("Ignored while country query is present");
    });
    act(() => result.current.destinationState.addCityStop());

    expect(result.current.form.destinationCities.map((city) => city.city)).toEqual(["Tokyo", "Narnia"]);
    expect(result.current.form.destinationCities[1]).toMatchObject({
      country: "Japan",
      countryCode: "JP",
      timezone: "Asia/Tokyo",
    });
    expect(result.current.destinationState.countryQuery).toBe("");
    expect(result.current.destinationState.cityQuery).toBe("");
  });

  it("removes selected stops and keeps destination labels in sync", () => {
    const tokyo = tripCityOptions.find((city) => city.city === "Tokyo");
    const seoul = tripCityOptions.find((city) => city.city === "Seoul");
    if (!tokyo || !seoul) throw new Error("Destination fixtures are missing");
    const { result } = renderHook(() => useDestinationStateHarness([tokyo, seoul]));

    act(() => result.current.destinationState.removeCityStop("Tokyo"));

    expect(result.current.form.destinationCities.map((city) => city.city)).toEqual(["Seoul"]);
    expect(result.current.form.destinationLabel).toBe("Seoul");
    expect(result.current.form.countries).toEqual(["South Korea"]);
  });
});

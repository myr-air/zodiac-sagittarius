import type { Dispatch, SetStateAction } from "react";
import type { StopFormValues } from "@/src/features/itinerary/components";
import {
  normalizeStopHierarchyValues,
} from "@/src/trip/itinerary-core";
import {
  locationFieldsFromCandidate,
  resolveStopPlace,
  type PlaceResolver,
  type StopPlaceResolutionState,
} from "@/src/trip/places";
import { safeExternalHref } from "@/src/trip/places";
import type { ItineraryItem, Trip } from "@/src/trip/types";

type StopLocationFields = ReturnType<typeof locationFieldsFromCandidate>;

interface ResolveStopFormLocationInput {
  day: string;
  effectivePlaceResolver: PlaceResolver | null;
  fallbackLocationFields?: StopLocationFields;
  nextClientMutationId: (prefix: string) => string;
  setStopPlaceResolution: Dispatch<SetStateAction<StopPlaceResolutionState>>;
  shouldResolvePlace?: boolean;
  trip: Trip;
  values: StopFormValues;
}

export async function resolveStopFormLocation({
  day,
  effectivePlaceResolver,
  fallbackLocationFields,
  nextClientMutationId,
  setStopPlaceResolution,
  shouldResolvePlace = true,
  trip,
  values,
}: ResolveStopFormLocationInput): Promise<{
  locationFields: StopLocationFields;
  values: StopFormValues;
} | null> {
  const normalizedValues = normalizeStopHierarchyValues(values);
  setStopPlaceResolution(
    shouldResolvePlace &&
      effectivePlaceResolver &&
      !normalizedValues.resolvedPlace &&
      !normalizedValues.saveUnresolved
      ? { state: "resolving", candidates: [] }
      : { state: "idle", candidates: [] },
  );

  const placeResolution = shouldResolvePlace
    ? await resolveStopPlace(
        { ...normalizedValues, day },
        trip,
        effectivePlaceResolver,
        nextClientMutationId,
      )
    : { candidate: null, state: null };
  if (placeResolution.state) {
    setStopPlaceResolution(placeResolution.state);
    return null;
  }

  setStopPlaceResolution({ state: "idle", candidates: [] });
  return {
    locationFields: shouldResolvePlace
      ? locationFieldsFromCandidate(
          placeResolution.candidate,
          normalizedValues.place,
          normalizedValues.mapLink,
        )
      : fallbackLocationFields ??
        locationFieldsFromCandidate(
          null,
          normalizedValues.place,
          normalizedValues.mapLink,
        ),
    values: normalizedValues,
  };
}

export function shouldResolveUpdatedStopPlace(
  values: StopFormValues,
  item: Pick<ItineraryItem, "mapLink" | "place">,
): boolean {
  return (
    values.place !== item.place ||
    safeExternalHref(values.mapLink) !== safeExternalHref(item.mapLink) ||
    Boolean(values.resolvedPlace) ||
    Boolean(values.saveUnresolved)
  );
}

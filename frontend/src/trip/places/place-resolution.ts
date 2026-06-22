import { safeExternalHref } from "./safe-links";
import { readItineraryDetailString } from "@/src/trip/itinerary-items";
import type {
  ItineraryItem,
  PlaceResolutionCandidate,
  PlaceResolutionRequest,
  PlaceResolutionResponse,
  Trip,
} from "@/src/trip/types";

export type PlaceResolver = (
  request: PlaceResolutionRequest,
) => Promise<PlaceResolutionResponse>;
export { readItineraryDetailString };

export type StopPlaceResolutionState = {
  state: "idle" | "resolving" | "ambiguous" | "unresolved";
  candidates: PlaceResolutionCandidate[];
};

export interface StopPlaceResolutionValues {
  activity: string;
  day: string;
  mapLink?: string | null;
  place: string;
  resolvedPlace?: PlaceResolutionCandidate | null;
  saveUnresolved?: boolean;
}

export function buildMapLink(place: string): string {
  return place ? `https://maps.google.com/?q=${encodeURIComponent(place)}` : "";
}

export function mapResolutionPlaceHint(item: ItineraryItem): string {
  if (item.activityType === "travel") {
    return (
      readItineraryDetailString(item.details, "to") ||
      item.place ||
      readItineraryDetailString(item.details, "from")
    ).trim();
  }
  return item.place.trim();
}

export function mapResolutionActivity(item: ItineraryItem): string {
  if (item.activityType !== "travel") return item.activity;
  const from = readItineraryDetailString(item.details, "from");
  const to = readItineraryDetailString(item.details, "to") || item.place;
  return compactText([
    item.activity,
    from ? `from ${from}` : "",
    to ? `to ${to}` : "",
  ]);
}

export function buildMapPlaceResolutionRequest(
  item: ItineraryItem,
  trip: Pick<Trip, "countries" | "destinationLabel" | "originCountryCode">,
  options: { clientMutationId: string; placeHint: string },
): PlaceResolutionRequest {
  return {
    clientMutationId: options.clientMutationId,
    activity: mapResolutionActivity(item),
    placeHint: options.placeHint,
    destinationLabel: trip.destinationLabel,
    countries: Array.from(
      new Set(
        [trip.originCountryCode, ...(trip.countries ?? [])].filter(
          (country): country is string => Boolean(country),
        ),
      ),
    ),
    day: item.day,
  };
}

export async function resolveStopPlace(
  values: StopPlaceResolutionValues,
  trip: Trip,
  resolver: PlaceResolver | null,
  nextClientMutationId: (prefix: string) => string,
): Promise<{
  candidate: PlaceResolutionCandidate | null;
  state: StopPlaceResolutionState | null;
}> {
  if (values.resolvedPlace)
    return { candidate: values.resolvedPlace, state: null };
  if (safeExternalHref(values.mapLink))
    return { candidate: null, state: null };
  if (values.saveUnresolved || !resolver)
    return { candidate: null, state: null };
  try {
    const response = await resolver({
      clientMutationId: nextClientMutationId("place-resolve"),
      activity: values.activity,
      placeHint: values.place,
      destinationLabel: trip.destinationLabel,
      countries: trip.countries ?? [],
      day: values.day,
    });
    if (response.status === "resolved") {
      return { candidate: response.candidates[0] ?? null, state: null };
    }
    if (response.status === "ambiguous") {
      return {
        candidate: null,
        state: { state: "ambiguous", candidates: response.candidates },
      };
    }
    return { candidate: null, state: { state: "unresolved", candidates: [] } };
  } catch {
    return { candidate: null, state: { state: "unresolved", candidates: [] } };
  }
}

export function locationFieldsFromCandidate(
  candidate: PlaceResolutionCandidate | null,
  place: string,
  mapLink?: string | null,
) {
  const explicitMapLink = safeExternalHref(mapLink);
  return candidate
    ? {
        address: candidate.address,
        coordinates: candidate.coordinates,
        mapLink: explicitMapLink || candidate.mapLink,
      }
    : {
        address: place,
        coordinates: undefined,
        mapLink: explicitMapLink || buildMapLink(place),
      };
}

function compactText(parts: string[]): string {
  return parts.join(" ").split(/\s+/).filter(Boolean).join(" ");
}

import {
  createJsonApiRequester,
  type JsonApiRequester,
} from "@/src/shared/api/json-api-requester";
import type { ItineraryCoordinates } from "../types";
import { TripApiError } from "./trip-api-error";

export type TripApiRequester = JsonApiRequester;

export function createTripApiRequester({
  baseUrl = "",
  fetcher = fetch,
}: {
  baseUrl?: string;
  fetcher?: typeof fetch;
}): TripApiRequester {
  return createJsonApiRequester({
    baseUrl,
    fetcher,
    createError: (input) => new TripApiError(input),
  });
}

export function serializeItineraryLocation<
  T extends { coordinates?: ItineraryCoordinates | null; address?: string | null },
>(request: T) {
  const { coordinates, ...rest } = request;
  return {
    ...rest,
    ...(request.address !== undefined ? { address: request.address } : {}),
    ...(coordinates !== undefined
      ? {
          latitude: coordinates?.lat ?? null,
          longitude: coordinates?.lng ?? null,
        }
      : {}),
  };
}

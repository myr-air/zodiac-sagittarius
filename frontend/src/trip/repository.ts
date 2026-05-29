import { seedTrip } from "./seed";
import type { Trip } from "./types";
import type { TripStorageDriver } from "./storage";

export interface TripRepository {
  loadTrip(): Trip;
  saveTrip(trip: Trip): void;
  clearDraft(): void;
  describeSource(): {
    mode: "local";
    futureRestBase: "/trips/:tripId";
    futureWebSocketEvents: string[];
  };
}

export function createLocalTripRepository(storageKey: string, storage: TripStorageDriver): TripRepository {
  return {
    loadTrip() {
      const raw = storage.load(storageKey);
      if (!raw) return seedTrip;
      try {
        return JSON.parse(raw) as Trip;
      } catch {
        return seedTrip;
      }
    },
    saveTrip(trip) {
      storage.save(storageKey, JSON.stringify(trip));
    },
    clearDraft() {
      storage.remove(storageKey);
    },
    describeSource() {
      return {
        mode: "local",
        futureRestBase: "/trips/:tripId",
        futureWebSocketEvents: [
          "trip.updated",
          "plan.updated",
          "itinerary_item.created",
          "itinerary_item.updated",
          "itinerary_item.deleted",
          "suggestion.created",
          "suggestion.resolved",
          "presence.updated",
          "expense.summary_updated",
        ],
      };
    },
  };
}

export const tripStorageKey = "sagittarius:trip-draft";

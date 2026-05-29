import { seedTrip } from "./seed";
import type { Trip } from "./types";
import type { TripStorageDriver } from "./storage";

export interface TripRepository {
  loadTrip(): Trip;
  saveTrip(trip: Trip): void;
  clearDraft(): void;
  describeSource(): {
    mode: "demo";
    restBase: "demo-fixture";
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
        mode: "demo",
        restBase: "demo-fixture",
      };
    },
  };
}

export const tripStorageKey = "sagittarius:trip-draft";

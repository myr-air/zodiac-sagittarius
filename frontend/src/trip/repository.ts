import { seedTrip } from "./seed";
import type { Trip } from "./types";
import type { TripStorageDriver } from "./storage";

export interface TripRepository {
  loadTrip(): Trip;
  saveTrip(trip: Trip): void;
  clearDraft(): void;
  describeSource(): {
    mode: "seed";
    restBase: "seed-trip";
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
        mode: "seed",
        restBase: "seed-trip",
      };
    },
  };
}

export const tripStorageKey = "sagittarius:trip-draft";

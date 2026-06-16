import { seedTrip } from "./seed";
import type { Trip } from "./types";
import { createBrowserStorageDriver, type TripStorageDriver } from "./storage";

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

export function loadPersistedTripDraft(
  normalizeTrip: (trip: Trip) => Trip = (trip) => trip,
): Trip | null {
  const storage = createBrowserStorageDriver();
  const rawTrip = storage.load(tripStorageKey);
  if (!rawTrip) return null;
  try {
    return normalizeTrip(JSON.parse(rawTrip) as Trip);
  } catch {
    storage.remove(tripStorageKey);
    return null;
  }
}

export function persistTripDraft(
  trip: Trip,
  normalizeTrip: (trip: Trip) => Trip = (nextTrip) => nextTrip,
) {
  createBrowserStorageDriver().save(
    tripStorageKey,
    JSON.stringify(normalizeTrip(trip)),
  );
}

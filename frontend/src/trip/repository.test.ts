import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  loadPersistedTripDraft,
  persistTripDraft,
  tripStorageKey,
} from "./repository";
import { seedTrip } from "./seed";
import type { Trip } from "./types";

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: vi.fn(() => values.clear()),
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    key: vi.fn((index: number) => Array.from(values.keys())[index] ?? null),
    removeItem: vi.fn((key: string) => {
      values.delete(key);
    }),
    setItem: vi.fn((key: string, value: string) => {
      values.set(key, value);
    }),
  };
}

describe("trip draft repository helpers", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: createMemoryStorage(),
    });
  });

  it("persists and loads normalized trip drafts through browser storage", () => {
    const normalizeTrip = vi.fn((trip: Trip): Trip => ({
      ...trip,
      name: `${trip.name} normalized`,
    }));

    persistTripDraft(seedTrip, normalizeTrip);

    const rawDraft = window.localStorage.getItem(tripStorageKey);
    expect(rawDraft).not.toBeNull();
    expect(JSON.parse(rawDraft!).name).toBe(`${seedTrip.name} normalized`);
    expect(loadPersistedTripDraft()).toMatchObject({
      id: seedTrip.id,
      name: `${seedTrip.name} normalized`,
    });
    expect(normalizeTrip).toHaveBeenCalledWith(seedTrip);
  });

  it("normalizes loaded drafts and clears invalid JSON", () => {
    window.localStorage.setItem(tripStorageKey, JSON.stringify(seedTrip));

    expect(
      loadPersistedTripDraft((trip) => ({
        ...trip,
        name: "Loaded normalized",
      })),
    ).toMatchObject({ name: "Loaded normalized" });

    window.localStorage.setItem(tripStorageKey, "{bad-json");
    expect(loadPersistedTripDraft()).toBeNull();
    expect(window.localStorage.getItem(tripStorageKey)).toBeNull();
  });
});

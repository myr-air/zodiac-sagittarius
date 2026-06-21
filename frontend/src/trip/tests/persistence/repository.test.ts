import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installBrowserStorage } from "@/src/testing/browser-storage";
import {
  loadPersistedTripDraft,
  persistTripDraft,
  tripStorageKey,
} from "../../persistence";
import { seedTrip } from "../../seed";
import type { Trip } from "../../types";

describe("trip draft repository helpers", () => {
  let restoreStorage: () => void;

  beforeEach(() => {
    restoreStorage = installBrowserStorage();
  });

  afterEach(() => {
    restoreStorage();
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

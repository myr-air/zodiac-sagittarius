import { describe, expect, it } from "vitest";
import { seedTrip } from "../../../seed";
import { createLocalTripRepository } from "../../../repository";

describe("itinerary repository boundary", () => {
  it("saves through a repository boundary instead of direct UI storage", () => {
    const saved: string[] = [];
    const repository = createLocalTripRepository("test-storage", {
      load: () => saved[0] ?? null,
      save: (_key, value) => saved.push(value),
      remove: () => saved.splice(0),
    });

    repository.saveTrip(seedTrip);
    expect(repository.loadTrip().id).toBe(seedTrip.id);
    repository.clearDraft();
    expect(repository.loadTrip()).toBe(seedTrip);
    expect(repository.describeSource()).toEqual({
      mode: "seed",
      restBase: "seed-trip",
    });
  });

  it("returns the seed trip when local draft JSON is corrupt", () => {
    const repository = createLocalTripRepository("test-storage", {
      load: () => "{",
      save: () => undefined,
      remove: () => undefined,
    });

    expect(repository.loadTrip()).toBe(seedTrip);
  });
});

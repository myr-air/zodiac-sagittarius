import { describe, expect, it } from "vitest";
import { seedTrip } from "@/src/trip/seed";
import { tripSettingsStateKey } from "../trip-settings-state-key";

describe("trip settings state key", () => {
  it("derives a stable reset key from trip settings fields", () => {
    expect(tripSettingsStateKey(seedTrip)).toContain(seedTrip.id);
    expect(tripSettingsStateKey(seedTrip)).toContain(seedTrip.destinationLabel);
  });
});

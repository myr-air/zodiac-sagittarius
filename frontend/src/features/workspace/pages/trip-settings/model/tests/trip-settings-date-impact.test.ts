import { describe, expect, it } from "vitest";
import { seedTrip } from "@/src/trip/seed";
import { countStopsOutsideSettingsRange } from "../trip-settings-date-impact";
import { tripToSettingsForm } from "../trip-settings-form-model";

describe("trip settings date impact", () => {
  it("counts shifted itinerary stops outside the edited date range", () => {
    const form = {
      ...tripToSettingsForm(seedTrip),
      endDate: seedTrip.startDate,
    };

    expect(countStopsOutsideSettingsRange(seedTrip, form)).toBeGreaterThan(0);
  });
});

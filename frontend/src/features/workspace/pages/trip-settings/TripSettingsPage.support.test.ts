import { describe, expect, it } from "vitest";
import { seedTrip } from "@/src/trip/seed";
import {
  canSubmitTripSettings,
  countStopsOutsideSettingsRange,
  hasInvalidTripSettingsDateRange,
  normalizeTripSettingsForm,
  tripSettingsStateKey,
  tripToSettingsForm,
} from "./TripSettingsPage.support";

describe("TripSettingsPage.support", () => {
  it("derives a stable form and reset key from trip settings fields", () => {
    expect(tripToSettingsForm({ ...seedTrip, partySize: undefined, defaultTimezone: undefined })).toMatchObject({
      defaultTimezone: "Asia/Bangkok",
      destinationLabel: seedTrip.destinationLabel,
      name: seedTrip.name,
      partySize: 1,
    });
    expect(tripSettingsStateKey(seedTrip)).toContain(seedTrip.id);
    expect(tripSettingsStateKey(seedTrip)).toContain(seedTrip.destinationLabel);
  });

  it("counts shifted itinerary stops outside the edited date range", () => {
    const form = {
      ...tripToSettingsForm(seedTrip),
      endDate: seedTrip.startDate,
    };

    expect(countStopsOutsideSettingsRange(seedTrip, form)).toBeGreaterThan(0);
  });

  it("normalizes and validates form submission state", () => {
    const form = {
      ...tripToSettingsForm(seedTrip),
      defaultTimezone: " Asia/Bangkok ",
      destinationLabel: " Hong Kong ",
      name: " Summer trip ",
      partySize: 2.8,
    };

    expect(hasInvalidTripSettingsDateRange({ ...form, startDate: "2026-06-20", endDate: "2026-06-18" })).toBe(true);
    expect(canSubmitTripSettings({ canEdit: true, form, invalidDateRange: false, status: "idle" })).toBe(true);
    expect(canSubmitTripSettings({ canEdit: false, form, invalidDateRange: false, status: "idle" })).toBe(false);
    expect(canSubmitTripSettings({ canEdit: true, form: { ...form, partySize: 0 }, invalidDateRange: false, status: "idle" })).toBe(false);
    expect(canSubmitTripSettings({ canEdit: true, form, invalidDateRange: false, status: "saving" })).toBe(false);
    expect(normalizeTripSettingsForm(form)).toMatchObject({
      defaultTimezone: "Asia/Bangkok",
      destinationLabel: "Hong Kong",
      name: "Summer trip",
      partySize: 2,
    });
  });
});

import { describe, expect, it } from "vitest";
import { seedTrip } from "@/src/trip/seed";
import {
  canSubmitTripSettings,
  hasInvalidTripSettingsDateRange,
  normalizeTripSettingsForm,
  tripToSettingsForm,
} from "../trip-settings-form-model";

describe("trip settings form model", () => {
  it("derives a form from trip settings fields", () => {
    expect(tripToSettingsForm({ ...seedTrip, partySize: undefined, defaultTimezone: undefined })).toMatchObject({
      defaultTimezone: "Asia/Bangkok",
      destinationLabel: seedTrip.destinationLabel,
      name: seedTrip.name,
      partySize: 1,
    });
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

import { describe, expect, it } from "vitest";
import { seedTrip } from "@/src/trip/seed";
import {
  failedTripSettingsFormState,
  initialTripSettingsFormState,
  savedTripSettingsFormState,
  savingTripSettingsFormState,
  tripSettingsFormValueState,
} from "../trip-settings-form-state";

describe("trip settings form state", () => {
  it("initializes form values from the trip and idle save state", () => {
    expect(initialTripSettingsFormState(seedTrip)).toEqual({
      error: null,
      form: expect.objectContaining({
        destinationLabel: seedTrip.destinationLabel,
        name: seedTrip.name,
      }),
      status: "idle",
    });
  });

  it("updates form values and save lifecycle state", () => {
    const initial = initialTripSettingsFormState(seedTrip);
    const edited = tripSettingsFormValueState(initial, (current) => ({
      ...current,
      name: "Updated trip",
    }));
    const saving = savingTripSettingsFormState({
      ...edited,
      error: "Previous failure",
    });
    const saved = savedTripSettingsFormState(saving);
    const failed = failedTripSettingsFormState(saved, "Save failed");

    expect(edited.form.name).toBe("Updated trip");
    expect(saving).toEqual(expect.objectContaining({
      error: null,
      status: "saving",
    }));
    expect(saved.status).toBe("saved");
    expect(failed).toEqual(expect.objectContaining({
      error: "Save failed",
      status: "idle",
    }));
  });
});

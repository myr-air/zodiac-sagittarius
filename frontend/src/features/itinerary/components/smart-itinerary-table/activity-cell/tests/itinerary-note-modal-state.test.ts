import { describe, expect, it } from "vitest";

import {
  buildItineraryNoteModalSubmission,
  initialItineraryNoteModalState,
  setItineraryNoteModalSaving,
  updateItineraryNoteModalBody,
} from "../itinerary-note-modal-state";

describe("itinerary note modal state", () => {
  it("starts with an empty note and idle submit state", () => {
    expect(initialItineraryNoteModalState).toEqual({
      body: "",
      saving: false,
    });
  });

  it("updates note body without changing save state", () => {
    expect(
      updateItineraryNoteModalBody(
        {
          body: "",
          saving: true,
        },
        "Meet at exit A",
      ),
    ).toEqual({
      body: "Meet at exit A",
      saving: true,
    });
  });

  it("updates save state without changing note body", () => {
    expect(
      setItineraryNoteModalSaving(
        {
          body: "Bring passports",
          saving: false,
        },
        true,
      ),
    ).toEqual({
      body: "Bring passports",
      saving: true,
    });
  });

  it("builds trimmed note submissions only when not saving", () => {
    expect(
      buildItineraryNoteModalSubmission({
        body: "  Meet at exit A  ",
        saving: false,
      }),
    ).toEqual({ body: "Meet at exit A" });
    expect(
      buildItineraryNoteModalSubmission({
        body: "   ",
        saving: false,
      }),
    ).toBeNull();
    expect(
      buildItineraryNoteModalSubmission({
        body: "Already saving",
        saving: true,
      }),
    ).toBeNull();
  });
});

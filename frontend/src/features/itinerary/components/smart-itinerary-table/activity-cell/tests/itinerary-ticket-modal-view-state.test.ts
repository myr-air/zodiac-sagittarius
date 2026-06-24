import { describe, expect, it } from "vitest";

import {
  beginItineraryTicketModalViewSave,
  beginItineraryTicketModalViewUnlink,
  buildInitialItineraryTicketModalViewState,
  completeItineraryTicketModalViewSubmit,
  isItineraryTicketModalViewSubmitting,
  selectExistingItineraryTicket,
  selectExistingItineraryTicketMode,
  selectNewItineraryTicketMode,
} from "../itinerary-ticket-modal-view-state";

describe("itinerary ticket modal view state", () => {
  it("starts in new mode with the first candidate selected when nothing is linked", () => {
    expect(
      buildInitialItineraryTicketModalViewState({
        firstCandidateId: "booking-flight",
      }),
    ).toEqual({
      mode: "new",
      selectedBookingId: "booking-flight",
      submitState: {
        saving: false,
        unlinking: false,
      },
    });
  });

  it("starts in existing mode with the linked candidate selected", () => {
    expect(
      buildInitialItineraryTicketModalViewState({
        firstCandidateId: "booking-flight",
        initiallyLinkedId: "booking-hotel",
      }),
    ).toEqual({
      mode: "existing",
      selectedBookingId: "booking-hotel",
      submitState: {
        saving: false,
        unlinking: false,
      },
    });
  });

  it("switches modes without losing the existing candidate selection", () => {
    const existing = buildInitialItineraryTicketModalViewState({
      firstCandidateId: "booking-flight",
    });

    const newMode = selectNewItineraryTicketMode(
      selectExistingItineraryTicketMode(existing, "booking-hotel"),
    );

    expect(newMode).toEqual({
      ...existing,
      mode: "new",
      selectedBookingId: "booking-hotel",
    });
  });

  it("updates the selected existing ticket independently from submit state", () => {
    const saving = beginItineraryTicketModalViewSave(
      buildInitialItineraryTicketModalViewState({
        firstCandidateId: "booking-flight",
      }),
    );

    expect(selectExistingItineraryTicket(saving, "booking-hotel")).toEqual({
      ...saving,
      selectedBookingId: "booking-hotel",
    });
  });

  it("tracks save and unlink submissions through the shared submit state", () => {
    const initial = buildInitialItineraryTicketModalViewState({});

    const saving = beginItineraryTicketModalViewSave(initial);
    expect(saving.submitState).toEqual({
      saving: true,
      unlinking: false,
    });
    expect(isItineraryTicketModalViewSubmitting(saving)).toBe(true);

    const unlinking = beginItineraryTicketModalViewUnlink(saving);
    expect(unlinking.submitState).toEqual({
      saving: false,
      unlinking: true,
    });
    expect(isItineraryTicketModalViewSubmitting(unlinking)).toBe(true);

    expect(completeItineraryTicketModalViewSubmit(unlinking)).toEqual(initial);
  });
});

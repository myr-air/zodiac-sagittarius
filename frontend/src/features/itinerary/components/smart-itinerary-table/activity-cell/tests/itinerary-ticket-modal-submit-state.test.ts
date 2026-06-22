import { describe, expect, it } from "vitest";

import {
  beginItineraryTicketModalSave,
  beginItineraryTicketModalUnlink,
  completeItineraryTicketModalSubmit,
  initialItineraryTicketModalSubmitState,
  isItineraryTicketModalSubmitting,
} from "../itinerary-ticket-modal-submit-state";

describe("itinerary ticket modal submit state", () => {
  it("starts idle", () => {
    expect(initialItineraryTicketModalSubmitState).toEqual({
      saving: false,
      unlinking: false,
    });
    expect(
      isItineraryTicketModalSubmitting(initialItineraryTicketModalSubmitState),
    ).toBe(false);
  });

  it("tracks save submission as the only active operation", () => {
    const state = beginItineraryTicketModalSave();

    expect(state).toEqual({
      saving: true,
      unlinking: false,
    });
    expect(isItineraryTicketModalSubmitting(state)).toBe(true);
  });

  it("tracks unlink submission as the only active operation", () => {
    const state = beginItineraryTicketModalUnlink();

    expect(state).toEqual({
      saving: false,
      unlinking: true,
    });
    expect(isItineraryTicketModalSubmitting(state)).toBe(true);
  });

  it("completes submissions back to the initial state", () => {
    expect(completeItineraryTicketModalSubmit()).toBe(
      initialItineraryTicketModalSubmitState,
    );
  });
});

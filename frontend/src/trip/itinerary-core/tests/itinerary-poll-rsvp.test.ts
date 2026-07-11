import { describe, expect, it } from "vitest";
import type { ItineraryItem } from "../itinerary-types";
import type { ActivityPoll } from "../../polls/poll-types";
import type { ActivityRsvp } from "../../rsvp/rsvp-types";

describe("ItineraryItem with poll and RSVP", () => {
  it("accepts optional poll field", () => {
    const poll: ActivityPoll = {
      id: "poll1",
      activityId: "act1",
      isOpen: true,
      createdBy: "mem1",
      options: [{ id: "opt1", label: "Option 1", sortOrder: 0 }],
      votes: [],
    };
    const item = { id: "item1", activity: "Test", poll } as ItineraryItem;
    expect(item.poll).toBe(poll);
  });

  it("accepts optional rsvp field", () => {
    const rsvp: ActivityRsvp[] = [
      { activityId: "act1", memberId: "mem1", status: "going", updatedAt: "2027-01-01T00:00:00Z" },
    ];
    const item = { id: "item1", activity: "Test", rsvp } as ItineraryItem;
    expect(item.rsvp).toEqual(rsvp);
  });

  it("works without poll and rsvp (backward compatibility)", () => {
    const item = { id: "item1", activity: "Test" } as ItineraryItem;
    expect(item.poll).toBeUndefined();
    expect(item.rsvp).toBeUndefined();
  });
});

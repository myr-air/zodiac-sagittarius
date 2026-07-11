import { describe, expect, it } from "vitest";
import type { ActivityRsvp, Headcount, RsvpStatus } from "../rsvp-types";

describe("RsvpStatus", () => {
  it("accepts going", () => {
    const status: RsvpStatus = "going";
    expect(status).toBe("going");
  });

  it("accepts not-going", () => {
    const status: RsvpStatus = "not-going";
    expect(status).toBe("not-going");
  });
});

describe("ActivityRsvp", () => {
  it("has the expected shape", () => {
    const rsvp: ActivityRsvp = {
      activityId: "act1",
      memberId: "mem1",
      status: "going",
      updatedAt: "2027-01-01T00:00:00Z",
    };
    expect(rsvp.activityId).toBe("act1");
    expect(rsvp.memberId).toBe("mem1");
    expect(rsvp.status).toBe("going");
  });
});

describe("Headcount", () => {
  it("has the expected shape", () => {
    const headcount: Headcount = {
      activityId: "act1",
      going: 3,
      notGoing: 1,
      total: 4,
      members: [
        { memberId: "mem1", status: "going" },
        { memberId: "mem2", status: "not-going" },
      ],
    };
    expect(headcount.activityId).toBe("act1");
    expect(headcount.going).toBe(3);
    expect(headcount.notGoing).toBe(1);
    expect(headcount.total).toBe(4);
    expect(headcount.members).toHaveLength(2);
  });
});

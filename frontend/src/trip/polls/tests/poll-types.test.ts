import { describe, expect, it } from "vitest";
import type { ActivityPoll, PollOption, ActivityVote } from "../poll-types";

describe("PollOption", () => {
  it("has the expected shape", () => {
    const option: PollOption = { id: "opt1", label: "Option 1", sortOrder: 0 };
    expect(option.id).toBe("opt1");
    expect(option.label).toBe("Option 1");
    expect(option.sortOrder).toBe(0);
  });
});

describe("ActivityVote", () => {
  it("has the expected shape", () => {
    const vote: ActivityVote = {
      activityId: "act1",
      memberId: "mem1",
      selectedOptionId: "opt1",
      votedAt: "2027-01-01T00:00:00Z",
    };
    expect(vote.activityId).toBe("act1");
    expect(vote.memberId).toBe("mem1");
  });
});

describe("ActivityPoll", () => {
  it("has the expected shape", () => {
    const poll: ActivityPoll = {
      id: "poll1",
      activityId: "act1",
      isOpen: true,
      createdBy: "mem1",
      options: [{ id: "opt1", label: "Option 1", sortOrder: 0 }],
      votes: [],
    };
    expect(poll.id).toBe("poll1");
    expect(poll.isOpen).toBe(true);
    expect(poll.options).toHaveLength(1);
    expect(poll.votes).toHaveLength(0);
  });
});

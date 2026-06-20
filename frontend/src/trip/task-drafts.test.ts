import { describe, expect, it } from "vitest";
import { buildTaskCreateDraft } from "./tasks";

describe("task drafts", () => {
  it("builds shared task drafts with optional assignees", () => {
    expect(
      buildTaskCreateDraft(
        {
          title: "  Book tram tickets  ",
          visibility: "shared",
          assigneeId: "member-beam",
          relatedItemId: "item-peak",
        },
        {
          title: "Book tram tickets",
          tripPlanId: "plan-main",
          currentMemberId: "member-aom",
        },
      ),
    ).toEqual({
      title: "Book tram tickets",
      status: "open",
      visibility: "shared",
      kind: "prep",
      tripPlanId: "plan-main",
      createdBy: "member-aom",
      assigneeId: "member-beam",
      relatedItemId: "item-peak",
    });
  });

  it("assigns private task drafts to the current member", () => {
    expect(
      buildTaskCreateDraft(
        {
          title: "Passport scan",
          visibility: "private",
          assigneeId: "member-beam",
        },
        {
          title: "Passport scan",
          currentMemberId: "member-aom",
        },
      ),
    ).toMatchObject({
      visibility: "private",
      assigneeId: "member-aom",
      relatedItemId: null,
    });
  });
});

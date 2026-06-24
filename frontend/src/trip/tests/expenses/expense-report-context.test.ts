import { describe, expect, it } from "vitest";

import {
  buildExpenseReportContext,
  buildItineraryNameContext,
  buildMemberNameContext,
  formatExpenseComments,
} from "../../expenses/expense-report-context";

describe("expense report context", () => {
  it("resolves member and itinerary names with id fallbacks", () => {
    const context = buildExpenseReportContext({
      itineraryItems: [{ id: "item-dinner", activity: "Dinner" }],
      members: [{ id: "member-aom", displayName: "Aom" }],
    });

    expect(context.memberName("member-aom")).toBe("Aom");
    expect(context.memberName("missing-member")).toBe("missing-member");
    expect(context.itineraryName("item-dinner")).toBe("Dinner");
    expect(context.itineraryName("missing-item")).toBeNull();
  });

  it("builds partial contexts for report sections", () => {
    expect(
      buildMemberNameContext([{ id: "member-beam", displayName: "Beam" }]).memberName(
        "member-beam",
      ),
    ).toBe("Beam");
    expect(
      buildItineraryNameContext([{ id: "item-peak", activity: "Peak Tram" }]).itineraryName(
        "item-peak",
      ),
    ).toBe("Peak Tram");
  });

  it("formats non-empty comments with author names", () => {
    const context = buildMemberNameContext([
      { id: "member-aom", displayName: "Aom" },
    ]);

    expect(
      formatExpenseComments([
        {
          id: "comment-1",
          authorId: "member-aom",
          body: "  Keep receipt  ",
          createdAt: "2026-06-01T00:00:00.000Z",
        },
        {
          id: "comment-empty",
          authorId: "member-aom",
          body: " ",
          createdAt: "2026-06-01T00:00:00.000Z",
        },
      ], context),
    ).toEqual(["Aom: Keep receipt"]);
  });
});

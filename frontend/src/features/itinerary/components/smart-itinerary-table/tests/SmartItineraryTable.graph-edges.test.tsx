import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  buildItineraryItem,
  findGraphLine,
  renderSmartItineraryTable,
} from "@/src/features/itinerary/testing";

const renderTable = renderSmartItineraryTable;

describe("SmartItineraryTable graph edges", () => {
  it("draws dashed graph lines for same-plan gaps", () => {
    const earlyItem = buildItineraryItem({
      id: "gap-early",
      day: "2026-06-19",
      startTime: "08:00",
      durationMinutes: 30,
      activity: "Gap early",
      sortOrder: 100,
      pathRole: "main" as const,
    });
    const lateItem = buildItineraryItem({
      id: "gap-late",
      day: "2026-06-19",
      startTime: "09:15",
      durationMinutes: 30,
      activity: "Gap late",
      sortOrder: 200,
      pathRole: "main" as const,
    });

    renderTable({
      items: [earlyItem, lateItem],
      graphItems: [earlyItem, lateItem],
      selectedItemId: "gap-early",
    });

    const earlyDot = screen.getByRole("button", { name: /Gap early on Main/i });
    const lateDot = screen.getByRole("button", { name: /Gap late on Main/i });
    expect(findGraphLine(earlyDot, lateDot)).toHaveClass(
      "activity-path-graph-line--dashed",
    );
  });
});

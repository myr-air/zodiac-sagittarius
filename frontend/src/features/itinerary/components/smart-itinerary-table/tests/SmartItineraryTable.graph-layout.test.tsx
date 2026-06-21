import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { tripFixture } from "@/src/trip/testing/fixtures/trip-fixtures";
import {
  layoutRect,
  renderSmartItineraryTable,
} from "@/src/features/itinerary/testing";

const renderTable = renderSmartItineraryTable;

describe("SmartItineraryTable graph layout", () => {
  it("keeps data-day-drop anchors for graph measurement with add activity affordances", () => {
    renderTable();

    const dayDropAnchors = document.querySelectorAll("[data-day-drop]");
    expect(dayDropAnchors.length).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("button", {
        name: /เพิ่มสถานที่ \/ กิจกรรม|Add stop or activity/i,
      }),
    ).toHaveLength(dayDropAnchors.length);
  });

  it("aligns graph dots with measured blank activity rows", async () => {
    const firstItem = {
      ...tripFixture.planItems[0],
      id: "graph-measured-first",
      day: "2026-06-19",
      activity: "Graph measured first",
      pathGroupId: "path-group-measured-height",
      pathRole: "main" as const,
    };
    const secondItem = {
      ...tripFixture.planItems[1],
      id: "graph-measured-second",
      day: "2026-06-19",
      activity: "Graph measured second",
      pathGroupId: "path-group-measured-height",
      pathRole: "main" as const,
      sortOrder: firstItem.sortOrder + 10,
    };
    const rectSpy = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function mockRect(this: HTMLElement) {
      if (this.classList.contains("activity-path-graph")) return layoutRect(100, 284, 76);
      if (this.tagName === "TR" && this.querySelector(".activity-path-graph")) return layoutRect(100, 60);
      if (this.dataset.itemId === "graph-measured-first") return layoutRect(160, 108);
      if (this.dataset.itemId === "graph-measured-second") return layoutRect(268, 72);
      if (this.dataset.dayDrop === "2026-06-19") return layoutRect(340, 44);
      return layoutRect(0, 0);
    });

    try {
      renderTable({
        items: [firstItem, secondItem],
        graphItems: [firstItem, secondItem],
        selectedItemId: "graph-measured-first",
      });

      const firstDot = screen.getByRole("button", {
        name: /Graph measured first on Main/i,
      });
      const secondDot = screen.getByRole("button", {
        name: /Graph measured second on Main/i,
      });
      await vi.waitFor(() => expect(firstDot).toHaveStyle({ top: "96px" }));
      expect(secondDot).toHaveStyle({ top: "186px" });
      const graph = screen.getByRole("group", {
        name: /Activity path graph for Day 2/i,
      });
      expect(graph).toHaveStyle({ height: "201.5px" });
      expect(graph.querySelector("svg")).toHaveStyle({ height: "284px" });
    } finally {
      rectSpy.mockRestore();
    }
  });
});

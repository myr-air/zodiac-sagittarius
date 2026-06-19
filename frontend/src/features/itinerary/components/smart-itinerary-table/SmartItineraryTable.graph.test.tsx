import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { tripFixture } from "@/src/trip/trip-fixtures";
import {
  defaultDayPathOptions,
  findGraphLine,
  layoutRect,
  pathIdStoryPlanA,
  renderSmartItineraryTable,
} from "@/src/features/itinerary/testing";

const renderTable = renderSmartItineraryTable;

describe("SmartItineraryTable", () => {
  it("keeps graph nodes selectable while activity cells remain independent", async () => {
    const user = userEvent.setup();
    const onSelectItem = vi.fn();
    const mainItem = {
      ...tripFixture.planItems[0],
      id: "graph-main",
      day: "2026-06-19",
      activity: "Graph main",
      pathGroupId: "path-group-graph",
      pathRole: "main" as const,
    };
    const alternativeItem = {
      ...tripFixture.planItems[1],
      id: "graph-plan-a",
      day: "2026-06-19",
      activity: "Graph plan A",
      pathId: pathIdStoryPlanA,
      pathName: "Plan A",
      pathRole: "alternative" as const,
      sortOrder: mainItem.sortOrder + 10,
    };

    renderTable({
      items: [mainItem, alternativeItem],
      graphItems: [mainItem, alternativeItem],
      selectedItemId: "graph-main",
      onSelectItem,
      pathOptions: [...defaultDayPathOptions],
    });

    expect(
      screen.getByRole("group", { name: /Activity path graph for Day 2/i }),
    ).toHaveClass("activity-path-graph");
    await user.click(screen.getByRole("button", { name: /Graph plan A on Plan A/i }));
    expect(onSelectItem).toHaveBeenCalledWith("graph-plan-a");
    expect(
      screen.queryByRole("button", {
        name: /Drop activities on Plan A for Day 2/i,
      }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Move Graph plan A to path/i)).toBeInTheDocument();

    const planRow = document.querySelector<HTMLTableRowElement>(
      '[data-item-id="graph-plan-a"]',
    );
    expect(within(planRow as HTMLElement).getByDisplayValue("Graph plan A")).toBeInTheDocument();
    expect(onSelectItem).toHaveBeenCalledTimes(1);
  });

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

  it("allows keyboard graph path mutation and disables it for read-only roles", async () => {
    const user = userEvent.setup();
    const onMoveItemToPath = vi.fn();
    const mainItem = {
      ...tripFixture.planItems[0],
      id: "graph-main",
      day: "2026-06-19",
      activity: "Graph main",
      pathGroupId: "path-group-graph",
      pathRole: "main" as const,
    };

    renderTable({
      items: [mainItem],
      graphItems: [mainItem],
      selectedItemId: "graph-main",
      onMoveItemToPath,
      pathOptions: [...defaultDayPathOptions],
    });

    await user.selectOptions(
      screen.getByLabelText(/Move Graph main to path/i),
      pathIdStoryPlanA,
    );
    expect(onMoveItemToPath).toHaveBeenCalledWith(
      "graph-main",
      pathIdStoryPlanA,
    );

    cleanup();
    renderTable({
      items: [mainItem],
      graphItems: [mainItem],
      role: "viewer",
      selectedItemId: "graph-main",
      onMoveItemToPath,
      pathOptions: [...defaultDayPathOptions],
    });
    expect(screen.getByRole("button", { name: /Graph main on Main/i })).toHaveAttribute(
      "draggable",
      "false",
    );
    expect(screen.getByLabelText(/Move Graph main to path/i)).toBeDisabled();
  });

  it("draws dashed graph lines for same-plan gaps", () => {
    const earlyItem = {
      ...tripFixture.planItems[0],
      id: "gap-early",
      day: "2026-06-19",
      startTime: "08:00",
      durationMinutes: 30,
      activity: "Gap early",
      sortOrder: 100,
      pathRole: "main" as const,
    };
    const lateItem = {
      ...tripFixture.planItems[1],
      id: "gap-late",
      day: "2026-06-19",
      startTime: "09:15",
      durationMinutes: 30,
      activity: "Gap late",
      sortOrder: 200,
      pathRole: "main" as const,
    };

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

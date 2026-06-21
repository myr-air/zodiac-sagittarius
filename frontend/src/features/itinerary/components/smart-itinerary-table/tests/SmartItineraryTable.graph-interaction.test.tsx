import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { tripFixture } from "@/src/trip/testing/fixtures/trip-fixtures";
import {
  defaultDayPathOptions,
  pathIdStoryPlanA,
  renderSmartItineraryTable,
} from "@/src/features/itinerary/testing";

const renderTable = renderSmartItineraryTable;

describe("SmartItineraryTable graph interaction", () => {
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
});

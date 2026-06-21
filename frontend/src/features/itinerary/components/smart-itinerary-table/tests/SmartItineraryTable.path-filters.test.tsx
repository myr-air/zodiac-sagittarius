import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  defaultPathOptionsForPanel,
  openHeaderControls,
  pathIdStoryPlanA,
  renderSmartItineraryTable,
} from "@/src/features/itinerary/testing";

const renderTable = renderSmartItineraryTable;

describe("SmartItineraryTable path filters", () => {
  it("keeps the activity path filter UI and day path picker separate from Trip Plans", async () => {
    const user = userEvent.setup();
    const onChangeDayPath = vi.fn();
    const onToggleShowAllPaths = vi.fn();
    renderTable({
      onChangeDayPath,
      onToggleShowAllPaths,
      pathOptions: [...defaultPathOptionsForPanel],
    });

    expect(screen.getByRole("button", { name: "Trip Plan controls" })).toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: /ตัวกรองแผน/i }),
    ).not.toBeInTheDocument();

    await openHeaderControls(user);
    const filterRegion = screen.getByRole("region", { name: /ตัวกรองแผน/i });
    expect(within(filterRegion).getByLabelText("Plan 1")).toBeInTheDocument();
    expect(within(filterRegion).getByLabelText("Plan A")).toBeInTheDocument();
    expect(within(filterRegion).queryByText("แผนฝนตก")).not.toBeInTheDocument();

    const showAllToggle = screen.getByRole("checkbox", { name: /แสดงทุก path/i });
    await user.click(showAllToggle);
    expect(onToggleShowAllPaths).toHaveBeenCalledWith(true);

    await user.click(screen.getByRole("button", { name: /Path for Day 2/i }));
    const dayPathMenu = screen.getByRole("listbox", {
      name: /Path for Day 2/i,
    });
    expect(dayPathMenu.closest(".table-scroll")).toBeNull();
    await user.click(
      within(dayPathMenu).getByRole("option", { name: "Plan A" }),
    );
    expect(onChangeDayPath).toHaveBeenCalledWith(
      "2026-06-19",
      pathIdStoryPlanA,
    );
  });
});

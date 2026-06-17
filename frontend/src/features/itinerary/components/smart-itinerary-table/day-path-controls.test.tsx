import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { mainPathOption, pathIdPlanA, pathOptionPlanA } from "@/src/features/itinerary/testing";
import { DayPathControls } from "./day-path-controls";

describe("DayPathControls", () => {
  const pathOptions = [mainPathOption, pathOptionPlanA];

  it("renders clear button and invokes clear callback", async () => {
    const user = userEvent.setup();
    const onClearDayPath = vi.fn();

    render(
      <DayPathControls
        day="2026-06-19"
        dayLabel="Day 2"
        dayPathOptions={pathOptions}
        dayPathOverride={pathIdPlanA}
        canEdit
        showAllPaths={false}
        hasAlternativePathOptions
        onClearDayPath={onClearDayPath}
      />,
    );

    const clearButton = screen.getByRole("button", { name: /Clear path override for Day 2/i });
    await user.click(clearButton);

    expect(onClearDayPath).toHaveBeenCalledWith("2026-06-19");
  });

  it("does not render when there are no alternative paths", () => {
    render(
      <DayPathControls
        day="2026-06-19"
        dayLabel="Day 2"
        dayPathOptions={[mainPathOption]}
        canEdit
        showAllPaths={false}
        hasAlternativePathOptions={false}
      />,
    );

    expect(screen.queryByRole("button", { name: /Clear path override/i })).not.toBeInTheDocument();
  });
});

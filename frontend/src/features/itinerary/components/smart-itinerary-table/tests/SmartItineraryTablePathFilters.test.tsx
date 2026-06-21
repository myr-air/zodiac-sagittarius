import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { messages } from "@/src/i18n/messages";
import { mainPathOption, pathOptionPlanA, pathIdMain, pathIdPlanA } from "@/src/features/itinerary/testing";
import { SmartItineraryTablePathFilters } from "../SmartItineraryTablePathFilters";

describe("SmartItineraryTablePathFilters", () => {
  it("toggles a path filter option", async () => {
    const user = userEvent.setup();
    const onTogglePathFilter = vi.fn();

    render(
      <SmartItineraryTablePathFilters
        filterOptions={[mainPathOption, pathOptionPlanA]}
        itineraryLabels={messages.en.itinerary}
        onTogglePathFilter={onTogglePathFilter}
        onChangeShowAllPaths={vi.fn()}
        selectedFilterLabel="1 selected"
        selectedPathIds={new Set([pathIdMain, pathIdPlanA])}
        showAllPaths={false}
      />,
    );

    const mainCheckbox = screen.getByRole("checkbox", { name: "Main" });
    await user.click(mainCheckbox);

    expect(onTogglePathFilter).toHaveBeenCalledWith(pathIdMain);
    expect(screen.getByRole("checkbox", { name: "Show all paths" })).toBeInTheDocument();
  });

  it("notifies show-all-paths toggle", () => {
    const onChangeShowAllPaths = vi.fn();

    render(
      <SmartItineraryTablePathFilters
        filterOptions={[
          { id: pathIdMain, name: mainPathOption.name },
        ]}
        itineraryLabels={messages.en.itinerary}
        onTogglePathFilter={vi.fn()}
        onChangeShowAllPaths={onChangeShowAllPaths}
        selectedFilterLabel="1 selected"
        selectedPathIds={new Set([pathIdMain])}
        showAllPaths={false}
      />,
    );

    fireEvent.click(screen.getByRole("checkbox", { name: "Show all paths" }));
    expect(onChangeShowAllPaths).toHaveBeenCalledWith(true);
  });
});

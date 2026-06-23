import { screen } from "@testing-library/react";
import type { CSSProperties } from "react";
import { describe, expect, it } from "vitest";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { messages } from "@/src/i18n/messages";
import {
  buildItineraryItem,
  mainPathOption,
  pathRainOption,
} from "@/src/features/itinerary/testing";
import { SmartItineraryTableBody } from "../SmartItineraryTableBody";

describe("SmartItineraryTableBody", () => {
  const pathOptions = [mainPathOption, pathRainOption];
  const startDate = "2026-06-18";
  const today = buildItineraryItem({
    id: "table-body-day-one",
    day: startDate,
    activity: "Day one activity",
    sortOrder: 100,
  });
  const second = buildItineraryItem({
    id: "table-body-day-two",
    day: "2026-06-19",
    activity: "Day two activity",
    sortOrder: 200,
  });

  it("renders headers and day groups", () => {
    renderWithI18n(
      <SmartItineraryTableBody
        canRestructureItems
        collapsedDays={[]}
        groups={[
          { day: "2026-06-18", items: [today], warningCount: 0 },
          { day: "2026-06-19", items: [second], warningCount: 0 },
        ]}
        graphItemsByDay={new Map()}
        dailyBriefingsByDate={new Map()}
        pathOptions={pathOptions}
        dayPathOverrides={{}}
        showAllPaths={false}
        smartTableStyle={{ ["--graph-column-width"]: "128px" } as CSSProperties}
        graphColumnWidth={128}
        itineraryLabels={messages.en.itinerary}
        locale="en"
        startDate={startDate}
        selectedItemId={today.id}
        bookingDocs={[]}
        bookingLinkItems={[today, second]}
        onAddStop={() => {}}
        onOpenItemDetails={() => {}}
        onSelectItem={() => {}}
        onToggleDay={() => {}}
        tHeaders={messages.en.itinerary.headers}
      />,
      { locale: "en" },
    );

    expect(screen.getByRole("columnheader", { name: /Path graph/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Activity/i })).toBeInTheDocument();
    expect(screen.getByText("Day 1")).toBeInTheDocument();
    expect(screen.getByText("Day 2")).toBeInTheDocument();
  });
});

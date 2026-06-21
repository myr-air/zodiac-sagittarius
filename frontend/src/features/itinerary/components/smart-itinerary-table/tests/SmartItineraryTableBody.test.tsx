import { screen } from "@testing-library/react";
import type { CSSProperties } from "react";
import { describe, expect, it } from "vitest";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { messages } from "@/src/i18n/messages";
import { tripFixture } from "@/src/trip/testing/fixtures/trip-fixtures";
import { mainPathOption, pathRainOption } from "@/src/features/itinerary/testing";
import { SmartItineraryTableBody } from "../SmartItineraryTableBody";

describe("SmartItineraryTableBody", () => {
  const pathOptions = [mainPathOption, pathRainOption];
  const today = tripFixture.planItems[0];
  const second = tripFixture.planItems[1];

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
        startDate={tripFixture.trip.startDate}
        selectedItemId={today.id}
        bookingDocs={[]}
        bookingLinkItems={tripFixture.planItems}
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

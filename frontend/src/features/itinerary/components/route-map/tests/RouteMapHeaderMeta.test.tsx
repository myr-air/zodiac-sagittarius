import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { messages } from "@/src/i18n/messages";
import { allDaysFilter } from "@/src/features/itinerary/domain/route-map-model";
import { RouteMapHeaderMeta } from "../RouteMapHeaderMeta";

const routeDayGroups = [
  {
    color: "#2563eb",
    day: "2026-06-18",
    label: "Day 1",
    points: [],
  },
  {
    color: "#16a34a",
    day: "2026-06-19",
    label: "Day 2",
    points: [],
  },
];

describe("RouteMapHeaderMeta", () => {
  it("renders route-map header facts from one component", () => {
    render(
      <RouteMapHeaderMeta
        activeDay={allDaysFilter}
        copy={messages.en.map}
        endDate="2026-06-20"
        itemsCount={8}
        locale="en"
        mappedCount={6}
        routeDayGroups={routeDayGroups}
        startDate="2026-06-18"
        unresolvedCount={2}
        warningCount={1}
        warningCountLabel={messages.en.dates.warningCount}
      />,
    );

    expect(screen.getByText(/Jun 18/i)).toBeInTheDocument();
    expect(screen.getByText("6/8 mapped · 2 unresolved")).toBeInTheDocument();
    expect(
      screen.getByText(messages.en.dates.warningCount({ count: 1 })),
    ).toBeInTheDocument();
    expect(screen.getByText(messages.en.map.allDays)).toBeInTheDocument();
  });

  it("shows the selected day label", () => {
    render(
      <RouteMapHeaderMeta
        activeDay="2026-06-19"
        copy={messages.en.map}
        endDate="2026-06-20"
        itemsCount={8}
        locale="en"
        mappedCount={6}
        routeDayGroups={routeDayGroups}
        startDate="2026-06-18"
        unresolvedCount={2}
        warningCount={0}
        warningCountLabel={messages.en.dates.warningCount}
      />,
    );

    expect(screen.getByText("Day 2")).toBeInTheDocument();
  });
});

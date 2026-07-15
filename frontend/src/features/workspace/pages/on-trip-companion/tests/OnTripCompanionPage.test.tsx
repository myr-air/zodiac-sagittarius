import { describe, it, expect, vi, afterEach } from "vitest";
import { screen, fireEvent, cleanup } from "@testing-library/react";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { OnTripCompanionPage } from "../OnTripCompanionPage";
import type { ItineraryItem, NowNextState } from "@/src/trip/itinerary-core/itinerary-types";

function makeItem(overrides: Partial<ItineraryItem> = {}): ItineraryItem {
  return {
    id: "item-1",
    tripId: "trip-1",
    planVariantId: "pv-1",
    day: "2026-07-11",
    sortOrder: 0,
    startTime: "10:00",
    endTime: "11:00",
    activity: "Visit Shrine",
    activityType: "attraction",
    place: "Shrine",
    linkLabel: "",
    mapLink: "https://maps.example.com/shrine",
    durationMinutes: 60,
    transportation: "",
    details: {},
    note: "",
    createdBy: "member-1",
    updatedAt: "2026-07-11T00:00:00Z",
    version: 1,
    ...overrides,
  } as ItineraryItem;
}

function makeNowNext(overrides: Partial<NowNextState> = {}): NowNextState {
  return {
    current: makeItem({ id: "current-1", startTime: "10:00", endTime: "11:00", activity: "Current Activity" }),
    next: makeItem({ id: "next-1", startTime: "12:00", endTime: "13:00", activity: "Next Activity" }),
    fallbackReason: null,
    ...overrides,
  };
}

const baseProps = {
  itineraryItems: [makeItem({ id: "current-1", activity: "Current Activity" }), makeItem({ id: "next-1", startTime: "12:00", activity: "Next Activity" }), makeItem({ id: "upcoming-1", startTime: "14:00", activity: "Upcoming Activity" })],
  nowNextState: makeNowNext(),
  currentDay: "2026-07-11",
  tripStartDate: "2026-07-11",
  tripEndDate: "2026-07-13",
  tripDays: ["2026-07-11", "2026-07-12", "2026-07-13"],
  onDayChange: vi.fn(),
  onCheckOff: vi.fn(),
  onUndoCheckOff: vi.fn(),
  onNavigate: vi.fn(),
  activeNavTab: "now" as const,
  onNavChange: vi.fn(),
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("OnTripCompanionPage", () => {
  it("renders day switcher strip at top", () => {
    renderWithI18n(<OnTripCompanionPage {...baseProps} />, { locale: "en" });
    expect(screen.getByTestId("day-switcher-strip")).toBeInTheDocument();
  });

  it("renders Now/Next cards for current activity", () => {
    renderWithI18n(<OnTripCompanionPage {...baseProps} />, { locale: "en" });
    expect(screen.getByTestId("now-card")).toBeInTheDocument();
    expect(screen.getByTestId("now-activity")).toHaveTextContent("Current Activity");
    expect(screen.getByTestId("next-card")).toBeInTheDocument();
    expect(screen.getByTestId("next-activity")).toHaveTextContent("Next Activity");
  });

  it('shows "No current activity" when nowNextState.current is null', () => {
    renderWithI18n(<OnTripCompanionPage {...baseProps} nowNextState={makeNowNext({ current: null, next: null })} />, { locale: "en" });
    expect(screen.getByTestId("no-current-message")).toHaveTextContent("No current activity");
  });

  it("renders navigate button when current activity has mapLink", () => {
    renderWithI18n(<OnTripCompanionPage {...baseProps} />, { locale: "en" });
    const button = screen.getByTestId("navigate-button");
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it("navigate button is disabled when no mapLink", () => {
    const current = makeItem({ id: "current-1", mapLink: "" });
    renderWithI18n(
      <OnTripCompanionPage
        {...baseProps}
        nowNextState={makeNowNext({ current, next: makeItem({ id: "next-1", startTime: "12:00", activity: "Next Activity" }) })}
      />,
      { locale: "en" },
    );
    expect(screen.getByTestId("navigate-button")).toBeDisabled();
  });

  it("renders upcoming activities list", () => {
    renderWithI18n(<OnTripCompanionPage {...baseProps} />, { locale: "en" });
    expect(screen.getByTestId("upcoming-list-section")).toBeInTheDocument();
    expect(screen.getByTestId("upcoming-item-upcoming-1")).toHaveTextContent("Upcoming Activity");
  });

  it("renders bottom nav with 4 tabs", () => {
    renderWithI18n(<OnTripCompanionPage {...baseProps} />, { locale: "en" });
    const nav = screen.getByTestId("companion-bottom-nav");
    expect(nav).toBeInTheDocument();
    expect(screen.getByTestId("bottom-nav-now")).toBeInTheDocument();
    expect(screen.getByTestId("bottom-nav-map")).toBeInTheDocument();
    expect(screen.getByTestId("bottom-nav-checklist")).toBeInTheDocument();
    expect(screen.getByTestId("bottom-nav-expenses")).toBeInTheDocument();
  });

  it("day switcher selects day on click", () => {
    const onDayChange = vi.fn();
    renderWithI18n(<OnTripCompanionPage {...baseProps} onDayChange={onDayChange} />, { locale: "en" });
    fireEvent.click(screen.getByTestId("day-chip-2026-07-12"));
    expect(onDayChange).toHaveBeenCalledWith("2026-07-12");
  });

  it("check-off button marks activity as done", () => {
    renderWithI18n(<OnTripCompanionPage {...baseProps} />, { locale: "en" });
    fireEvent.click(screen.getByTestId("check-off-button"));
    expect(baseProps.onCheckOff).toHaveBeenCalledWith("current-1");
    expect(screen.getByTestId("check-off-completed")).toBeInTheDocument();
  });

  it("undo toast appears after check-off", () => {
    renderWithI18n(<OnTripCompanionPage {...baseProps} />, { locale: "en" });
    fireEvent.click(screen.getByTestId("check-off-button"));
    expect(screen.getByTestId("check-off-toast")).toBeInTheDocument();
    expect(screen.getByTestId("check-off-toast")).toHaveTextContent("Done: Current Activity");

    fireEvent.click(screen.getByTestId("check-off-undo"));
    expect(baseProps.onUndoCheckOff).toHaveBeenCalledWith("current-1");
    expect(screen.queryByTestId("check-off-toast")).not.toBeInTheDocument();
    expect(screen.getByTestId("check-off-button")).toBeInTheDocument();
  });
});

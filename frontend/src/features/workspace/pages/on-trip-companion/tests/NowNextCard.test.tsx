import { describe, it, expect, vi, afterEach } from "vitest";
import { screen, cleanup } from "@testing-library/react";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { NowNextCard } from "../NowNextCard";
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
    activity: "Activity",
    activityType: "attraction",
    place: "Place",
    linkLabel: "",
    mapLink: "",
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

function makeState(overrides: Partial<NowNextState> = {}): NowNextState {
  return {
    current: makeItem({ id: "current-1", startTime: "10:00", activity: "Current Activity" }),
    next: makeItem({ id: "next-1", startTime: "12:00", activity: "Next Activity" }),
    fallbackReason: null,
    ...overrides,
  };
}

const baseProps = {
  nowLabel: "Now",
  nextLabel: "Next",
  countdownLabel: (m: number) => `${m} min left`,
  noCurrentLabel: "No current activity",
};

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("NowNextCard", () => {
  it("renders now card with time and activity name", () => {
    renderWithI18n(<NowNextCard {...baseProps} nowNextState={makeState()} countdownMinutes={null} />, { locale: "en" });
    expect(screen.getByTestId("now-time")).toHaveTextContent("10:00");
    expect(screen.getByTestId("now-activity")).toHaveTextContent("Current Activity");
  });

  it("renders next card with smaller text", () => {
    renderWithI18n(<NowNextCard {...baseProps} nowNextState={makeState()} countdownMinutes={null} />, { locale: "en" });
    expect(screen.getByTestId("next-time")).toHaveTextContent("12:00");
    expect(screen.getByTestId("next-activity")).toHaveTextContent("Next Activity");
  });

  it("shows countdown when less than 60 minutes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-11T10:15:00"));
    renderWithI18n(
      <NowNextCard
        {...baseProps}
        nowNextState={makeState({ current: makeItem({ id: "current-1", startTime: "10:00", endTime: "11:00", activity: "Current Activity" }) })}
        countdownMinutes={45}
      />,
      { locale: "en" },
    );
    expect(screen.getByTestId("now-countdown")).toHaveTextContent("45 min left");
  });

  it('shows "No current activity" when current is null', () => {
    renderWithI18n(<NowNextCard {...baseProps} nowNextState={makeState({ current: null })} countdownMinutes={null} />, { locale: "en" });
    expect(screen.getByTestId("no-current-message")).toHaveTextContent("No current activity");
  });

  it("hides next card when next is null", () => {
    renderWithI18n(<NowNextCard {...baseProps} nowNextState={makeState({ next: null })} countdownMinutes={null} />, { locale: "en" });
    expect(screen.getByTestId("now-card")).toBeInTheDocument();
    expect(screen.queryByTestId("next-card")).not.toBeInTheDocument();
  });

  it("has aria-live polite", () => {
    renderWithI18n(<NowNextCard {...baseProps} nowNextState={makeState()} countdownMinutes={null} />, { locale: "en" });
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
  });
});

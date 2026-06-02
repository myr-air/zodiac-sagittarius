import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { tripFixture } from "@/src/demo/trip-fixtures";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { TimelineView } from "./TimelineView";

function renderTimeline(overrides: Partial<Parameters<typeof TimelineView>[0]> = {}) {
  const props: Parameters<typeof TimelineView>[0] = {
    contextRailOpen: false,
    endDate: tripFixture.trip.endDate,
    items: tripFixture.planItems,
    selectedItemId: "item-dimdim",
    startDate: tripFixture.trip.startDate,
    tripName: tripFixture.trip.name,
    onSelectItem: vi.fn(),
    onToggleContextRail: vi.fn(),
    ...overrides,
  };
  renderWithI18n(<TimelineView {...props} />, { locale: "th" });
  return props;
}

describe("TimelineView", () => {
  it("bridges the timeline shell and selected stop to Tailwind classes", () => {
    renderTimeline();

    const timeline = screen.getByRole("region", { name: /ไทม์ไลน์ทริป/i });
    expect(timeline).toHaveClass("timeline-panel", "grid", "gap-3");

    const grid = timeline.querySelector(".timeline-grid");
    expect(grid).toHaveClass("timeline-grid", "grid", "gap-3");

    const selectedButton = screen.getByRole("button", { name: /เลือกจุดในไทม์ไลน์ Dim Dim Sum/i });
    const selectedStop = selectedButton.closest(".timeline-stop");
    expect(selectedStop).toHaveClass("timeline-stop", "timeline-stop--selected", "relative");
    expect(selectedButton).toHaveClass("timeline-stop-button", "grid", "min-h-[86px]");
    expect(within(selectedButton).getByText(/Dim Dim Sum/i).closest(".timeline-copy")).toHaveClass("timeline-copy", "grid", "min-w-0");
  });

  it("keeps stop selection and details toggle behavior", async () => {
    const user = userEvent.setup();
    const props = renderTimeline();

    await user.click(screen.getByRole("button", { name: /เลือกจุดในไทม์ไลน์ Symphony of Lights/i }));
    expect(props.onSelectItem).toHaveBeenCalledWith("item-symphony-lights");

    await user.click(screen.getByRole("button", { name: /เปิดรายละเอียด/i }));
    expect(props.onToggleContextRail).toHaveBeenCalledTimes(1);
  });
});

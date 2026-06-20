import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { tripFixture } from "@/src/trip/trip-fixtures";
import {
  createDragDataTransfer,
  renderSmartItineraryTable,
} from "@/src/features/itinerary/testing";

const renderTable = renderSmartItineraryTable;

describe("SmartItineraryTable sub-activity actions", () => {
  it("renders add activity rows for expanded days", async () => {
    const user = userEvent.setup();
    const onAddStop = vi.fn();

    renderTable({ onAddStop });

    const addActivityButtons = screen.getAllByRole("button", {
      name: /เพิ่มสถานที่ \/ กิจกรรม|Add stop/i,
    });
    expect(addActivityButtons.length).toBeGreaterThan(0);

    await user.click(addActivityButtons[0]);
    expect(onAddStop).toHaveBeenCalledWith(tripFixture.planItems[0].day);
  });

  it("shows an add sub-activity row for a selected activity with no sub-activities", async () => {
    const user = userEvent.setup();
    const onAddSubActivity = vi.fn();
    const parent = {
      ...tripFixture.planItems[0],
      id: "empty-sub-parent",
      activity: "Harbour transfer",
      day: "2026-06-19",
      sortOrder: 10,
    };

    renderTable({
      items: [parent],
      graphItems: [parent],
      selectedItemId: "empty-sub-parent",
      onAddSubActivity,
    });

    const parentRow = document.querySelector<HTMLTableRowElement>(
      '[data-item-id="empty-sub-parent"]',
    );
    expect(parentRow).not.toBeNull();
    expect(parentRow?.querySelector(".sub-activity-list")).toBeInTheDocument();

    await user.click(
      within(parentRow as HTMLElement).getByRole("button", {
        name: /Add sub-activity|เพิ่มกิจกรรมย่อย/i,
      }),
    );
    expect(onAddSubActivity).toHaveBeenCalledWith("empty-sub-parent");
  });

  it("shows an add sub-activity row after expanding an unselected empty activity", async () => {
    const user = userEvent.setup();
    const onAddSubActivity = vi.fn();
    const selectedSibling = {
      ...tripFixture.planItems[0],
      id: "selected-sibling",
      activity: "Selected sibling",
      day: "2026-06-19",
      sortOrder: 10,
    };
    const parent = {
      ...tripFixture.planItems[1],
      id: "unselected-empty-sub-parent",
      activity: "Bus to Shenzhen",
      day: "2026-06-19",
      sortOrder: 20,
    };

    renderTable({
      items: [selectedSibling, parent],
      graphItems: [selectedSibling, parent],
      selectedItemId: "selected-sibling",
      onAddSubActivity,
    });

    const parentRow = document.querySelector<HTMLTableRowElement>(
      '[data-item-id="unselected-empty-sub-parent"]',
    );
    expect(parentRow).not.toBeNull();
    expect(parentRow?.querySelector(".sub-activity-list")).toBeNull();

    await user.click(
      within(parentRow as HTMLElement).getAllByRole("button", {
        name: /Sub-activities for Bus to Shenzhen/i,
      })[0],
    );

    await user.click(
      within(parentRow as HTMLElement).getByRole("button", {
        name: /Add sub-activity|เพิ่มกิจกรรมย่อย/i,
      }),
    );
    expect(onAddSubActivity).toHaveBeenCalledWith("unselected-empty-sub-parent");
  });

  it("renders sub-activities without inline drag and drop controls", () => {
    const parentA = {
      ...tripFixture.planItems[0],
      id: "parent-a",
      activity: "Parent A",
      day: "2026-06-19",
      sortOrder: 10,
    };
    const parentB = {
      ...tripFixture.planItems[0],
      id: "parent-b",
      activity: "Parent B",
      day: "2026-06-19",
      sortOrder: 30,
    };
    const childA1 = {
      ...tripFixture.planItems[1],
      id: "child-a-1",
      parentItemId: "parent-a",
      activity: "Child A1",
      day: "2026-06-19",
      sortOrder: 11,
    };
    const childA2 = {
      ...tripFixture.planItems[2],
      id: "child-a-2",
      parentItemId: "parent-a",
      activity: "Child A2",
      day: "2026-06-19",
      sortOrder: 12,
    };
    const childB1 = {
      ...tripFixture.planItems[3],
      id: "child-b-1",
      parentItemId: "parent-b",
      activity: "Child B1",
      day: "2026-06-19",
      sortOrder: 31,
    };

    renderTable({
      items: [parentA, childA1, childA2, parentB, childB1],
      graphItems: [parentA, childA1, childA2, parentB, childB1],
      selectedItemId: "parent-a",
    });

    const parentARow = document.querySelector<HTMLElement>(
      '[data-item-id="parent-a"]',
    );
    const parentBRow = document.querySelector<HTMLElement>(
      '[data-item-id="parent-b"]',
    );
    expect(parentARow).not.toBeNull();
    expect(parentBRow).not.toBeNull();
    fireEvent.click(
      within(parentARow as HTMLElement).getAllByRole("button", {
        name: /Sub-activities for Parent A/i,
      })[0],
    );
    fireEvent.click(
      within(parentBRow as HTMLElement).getAllByRole("button", {
        name: /Sub-activities for Parent B/i,
      })[0],
    );

    const childA1Line = document.querySelector<HTMLElement>(
      '[data-sub-item-id="child-a-1"]',
    );
    const childA2Line = document.querySelector<HTMLElement>(
      '[data-sub-item-id="child-a-2"]',
    );
    const childB1Line = document.querySelector<HTMLElement>(
      '[data-sub-item-id="child-b-1"]',
    );
    expect(childA1Line).not.toBeNull();
    expect(childA2Line).not.toBeNull();
    expect(childB1Line).not.toBeNull();

    expect(childA1Line).not.toHaveAttribute("draggable", "true");
    expect(childA2Line).not.toHaveAttribute("draggable", "true");
    expect(childB1Line).not.toHaveAttribute("draggable", "true");
    expect(childA1Line?.querySelector(".cursor-grab")).toBeNull();
    fireEvent.drop(childA2Line as HTMLElement, {
      dataTransfer: createDragDataTransfer(),
    });
  });
});

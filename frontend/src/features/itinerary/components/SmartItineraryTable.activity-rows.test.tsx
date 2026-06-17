import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { tripFixture } from "@/src/trip/trip-fixtures";
import {
  createDragDataTransfer,
  renderSmartItineraryTable,
} from "@/src/features/itinerary/testing";

const renderTable = renderSmartItineraryTable;

describe("SmartItineraryTable", () => {
  it("renders graph and compact activity cells for activity rows", () => {
    renderTable();

    const table = document.querySelector(".smart-table");
    expect(table).toHaveClass("smart-table", "min-w-[520px]");
    expect(screen.getByRole("columnheader", { name: "Path graph" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Activity" })).toBeInTheDocument();
    expect(
      screen.queryByRole("columnheader", {
        name: /เวลา|Time|place|Type|Map|Actions|ประเภท|จัดการ/i,
      }),
    ).not.toBeInTheDocument();

    const itemRows = document.querySelectorAll<HTMLTableRowElement>(
      ".item-placeholder-row[data-item-id]",
    );
    expect(itemRows.length).toBeGreaterThan(0);
    for (const row of itemRows) {
      expect(row.querySelector(".item-placeholder-cell")).toBeInTheDocument();
      expect(row.querySelector(".activity-cell")).toBeInTheDocument();
      expect(row.textContent?.trim()).not.toBe("");
      expect(
        within(row).getByRole("button", {
          name: /เปิดรายละเอียดของ|Open details for/i,
        }),
      ).toBeInTheDocument();
      expect(
        within(row).getAllByRole("button", {
          name: /แก้ไขประเภท|Edit type/i,
        }).length,
      ).toBeGreaterThanOrEqual(1);
    }
    expect(itemRows[0]?.querySelector(".activity-cell")).toHaveAttribute(
      "data-selected",
      "true",
    );
    expect(
      itemRows[0]?.querySelector(".activity-cell"),
    ).toHaveClass(
      "min-h-[60px]",
      "grid-cols-[64px_112px_minmax(0,1fr)]",
      "data-[selected=true]:bg-(--color-route-soft)",
    );
    expect(
      within(itemRows[0]).getByRole("button", {
        name: /เปิดรายละเอียดของ|Open details for/i,
      }),
    ).toHaveClass("size-7");
    expect(
      within(itemRows[0]).getAllByRole("button", {
        name: /แก้ไขประเภท|Edit type/i,
      }).find((button) => button.className.includes("activity-type-picker ")),
    ).toHaveClass(
      "activity-type-picker",
      "!min-h-[52px]",
      "rounded-(--radius-sm)",
      "[&_.inline-option-picker-caret]:hidden",
    );
    expect(
      within(itemRows[0]).getAllByRole("button", {
        name: /แก้ไขประเภท|Edit type/i,
      })[0]?.querySelector(".icon"),
    ).toBeInTheDocument();
    const subActivityToggle = within(itemRows[0]).getAllByRole("button", {
      name: /Sub-activities for/i,
    })[0];
    expect(subActivityToggle).toHaveClass("size-7");
    expect(subActivityToggle).toHaveAttribute("aria-expanded", "false");
    expect(itemRows[0]?.querySelector(".sub-activity-list")).toBeInTheDocument();
    expect(
      within(itemRows[0]).getByRole("button", {
        name: /Add sub-activity|เพิ่มกิจกรรมย่อย/i,
      }),
    ).toBeInTheDocument();
    const rowWithoutSubItems = Array.from(itemRows).find(
      (row) =>
        row !== itemRows[0] &&
        within(row).queryByRole("button", {
          name: /Add sub-activity|เพิ่มกิจกรรมย่อย/i,
        }) === null,
    );
    expect(rowWithoutSubItems).toBeDefined();

    expect(
      screen.queryByRole("region", { name: /รายละเอียดจุดที่เลือก/i }),
    ).not.toBeInTheDocument();

    fireEvent.click(subActivityToggle);
    expect(subActivityToggle).toHaveAttribute("aria-expanded", "true");
    expect(itemRows[0]?.querySelector(".sub-activity-list")).toHaveClass(
      "max-[640px]:hidden",
    );
  });

  it("edits activity start and optional end time in a focused modal", async () => {
    const user = userEvent.setup();
    const onUpdateItemInline = vi.fn();
    const item = {
      ...tripFixture.planItems[0],
      id: "time-modal-item",
      activity: "Harbour transfer",
      startTime: "08:00",
      endTime: "09:15",
      endOffsetDays: 0,
      durationMinutes: 75,
    };

    renderTable({
      items: [item],
      graphItems: [item],
      selectedItemId: item.id,
      onUpdateItemInline,
    });

    const row = document.querySelector<HTMLTableRowElement>(
      '[data-item-id="time-modal-item"]',
    );
    expect(row).not.toBeNull();
    const timeButton = within(row as HTMLElement).getByRole("button", {
      name: /แก้ไขเวลา Harbour transfer/i,
    });
    expect(timeButton).toHaveTextContent("08:00");
    expect(timeButton).toHaveAttribute("title", "08:00 - 09:15\n1 h 15 m");
    expect(row).toHaveTextContent("08:00");
    expect(row).not.toHaveTextContent("08:00-09:15");

    await user.click(timeButton);

    const dialog = screen.getByRole("dialog", {
      name: /แก้ไขเวลา Harbour transfer/i,
    });
    expect(within(dialog).getByText(/ตัวอย่างที่จะแสดง/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/ระยะเวลา: 1 h 15 m/i)).toBeInTheDocument();

    const endInput = within(dialog).getByLabelText("เวลาจบ");
    await user.clear(endInput);
    await user.type(endInput, "10:30");
    expect(within(dialog).getByText(/ระยะเวลา: 2 h 30 m/i)).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "บันทึก" }));

    await waitFor(() => {
      expect(onUpdateItemInline).toHaveBeenCalledWith("time-modal-item", {
        startTime: "08:00",
        endTime: "10:30",
        endOffsetDays: 0,
        durationMinutes: 150,
      });
    });
  });

  it("opens travel sub-type options from the type picker and stores the selected mode", async () => {
    const user = userEvent.setup();
    const onUpdateItemInline = vi.fn();
    const item = {
      ...tripFixture.planItems[0],
      id: "travel-subtype-row",
      activity: "Hotel transfer",
      activityType: "travel" as const,
      details: {
        ...tripFixture.planItems[0].details,
        mode: "bus",
      },
    };

    renderTable({
      items: [item],
      graphItems: [item],
      selectedItemId: item.id,
      onUpdateItemInline,
    });

    const row = document.querySelector<HTMLTableRowElement>(
      '[data-item-id="travel-subtype-row"]',
    );
    expect(row).not.toBeNull();
    const typeButton = within(row as HTMLElement)
      .getAllByRole("button", { name: /แก้ไขประเภท Hotel transfer/i })
      .find((button) => button.className.includes("activity-type-picker "));
    expect(typeButton).toBeDefined();

    await user.click(typeButton as HTMLElement);
    expect(screen.getByRole("listbox", { name: /แก้ไขประเภท Hotel transfer/i })).toBeInTheDocument();
    expect(screen.getByRole("listbox", { name: /เดินทาง options/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /แท็กซี่/i }));

    expect(onUpdateItemInline).toHaveBeenCalledWith("travel-subtype-row", {
      activityType: "travel",
      activitySubtype: "taxi",
      details: expect.objectContaining({ mode: "bus", subtype: "taxi" }),
    });
  });

  it("uses the same travel sub-type patch from the mobile type picker", async () => {
    const user = userEvent.setup();
    const onUpdateItemInline = vi.fn();
    const item = {
      ...tripFixture.planItems[0],
      id: "mobile-travel-subtype-row",
      activity: "Mobile transfer",
      activityType: "travel" as const,
      details: {
        ...tripFixture.planItems[0].details,
        mode: "bus",
      },
    };

    renderTable({
      items: [item],
      graphItems: [item],
      selectedItemId: item.id,
      onUpdateItemInline,
    });

    const row = document.querySelector<HTMLTableRowElement>(
      '[data-item-id="mobile-travel-subtype-row"]',
    );
    expect(row).not.toBeNull();
    const typeButton = within(row as HTMLElement)
      .getAllByRole("button", { name: /แก้ไขประเภท Mobile transfer/i })
      .find((button) => button.className.includes("activity-type-picker-mobile"));
    expect(typeButton).toBeDefined();

    await user.click(typeButton as HTMLElement);
    expect(screen.getByRole("listbox", { name: /เดินทาง options/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /แท็กซี่/i }));

    expect(onUpdateItemInline).toHaveBeenCalledWith("mobile-travel-subtype-row", {
      activityType: "travel",
      activitySubtype: "taxi",
      details: expect.objectContaining({ mode: "bus", subtype: "taxi" }),
    });
  });

  it("lets sub-activities switch from travel to another type and default", async () => {
    const user = userEvent.setup();
    const onUpdateItemInline = vi.fn();
    const parent = {
      ...tripFixture.planItems[0],
      id: "parent-type-switch",
      activity: "Parent route",
      day: "2026-06-19",
      sortOrder: 10,
    };
    const child = {
      ...tripFixture.planItems[1],
      id: "child-type-switch",
      parentItemId: "parent-type-switch",
      activity: "Airport transfer",
      activityType: "travel" as const,
      activitySubtype: "bus" as const,
      details: {
        ...tripFixture.planItems[1].details,
        mode: "bus",
      },
      day: "2026-06-19",
      sortOrder: 11,
    };

    renderTable({
      items: [parent, child],
      graphItems: [parent, child],
      selectedItemId: parent.id,
      onUpdateItemInline,
    });

    const parentRow = document.querySelector<HTMLTableRowElement>(
      '[data-item-id="parent-type-switch"]',
    );
    expect(parentRow).not.toBeNull();
    await user.click(
      within(parentRow as HTMLElement).getAllByRole("button", {
        name: /Sub-activities for Parent route/i,
      })[0],
    );
    const childLine = within(parentRow as HTMLElement)
      .getByDisplayValue("Airport transfer")
      .closest("[data-sub-item-id]");
    expect(childLine).not.toBeNull();

    const typeButton = within(childLine as HTMLElement).getByRole("button", {
      name: /แก้ไขประเภท Airport transfer/i,
    });
    await user.click(typeButton);
    await user.click(screen.getByRole("option", { name: /อาหาร/i }));

    expect(onUpdateItemInline).toHaveBeenCalledWith("child-type-switch", {
      activityType: "food",
      activitySubtype: null,
      details: expect.not.objectContaining({ mode: expect.anything() }),
    });

    await user.click(typeButton);
    await user.click(screen.getByRole("option", { name: /ทั่วไป/i }));

    expect(onUpdateItemInline).toHaveBeenCalledWith("child-type-switch", {
      activityType: "default",
      activitySubtype: null,
      details: expect.not.objectContaining({ mode: expect.anything() }),
    });
  });

  it("renders sub-activities inside their parent activity cell", async () => {
    const user = userEvent.setup();
    const onAddSubActivity = vi.fn();
    const parent = {
      ...tripFixture.planItems[0],
      id: "parent-activity",
      activity: "Parent route",
      place: "",
      day: "2026-06-19",
      sortOrder: 10,
    };
    const child = {
      ...tripFixture.planItems[1],
      id: "child-activity",
      parentItemId: "parent-activity",
      activity: "Buy Octopus card",
      place: "Airport station",
      day: "2026-06-19",
      sortOrder: 11,
    };
    const childWithoutPlace = {
      ...tripFixture.planItems[2],
      id: "child-without-place",
      parentItemId: "parent-activity",
      activity: "Check stored value",
      activityType: "food" as const,
      place: "",
      day: "2026-06-19",
      sortOrder: 12,
    };

    renderTable({
      items: [parent, child, childWithoutPlace],
      graphItems: [parent, child, childWithoutPlace],
      selectedItemId: "parent-activity",
      onAddSubActivity,
    });

    const parentRow = document.querySelector<HTMLTableRowElement>(
      '[data-item-id="parent-activity"]',
    );
    expect(parentRow).not.toBeNull();
    expect(within(parentRow as HTMLElement).getByDisplayValue("Parent route")).toBeInTheDocument();
    const parentBody = parentRow?.querySelector(".activity-cell > div:nth-of-type(3)");
    expect(parentBody).not.toHaveTextContent("@");
    within(parentBody as HTMLElement)
      .getAllByLabelText(/แก้ไขสถานที่|Edit place/i)
      .forEach((placeInput) => {
        expect(placeInput).toHaveAttribute("placeholder", "");
      });
    await user.click(
      within(parentRow as HTMLElement).getAllByRole("button", {
        name: /Sub-activities for Parent route/i,
      })[0],
    );
    expect(within(parentRow as HTMLElement).getByDisplayValue("Buy Octopus card")).toBeInTheDocument();
    expect(parentRow?.querySelector(".sub-activity-list")).toHaveClass(
      "relative",
      "col-start-2",
      "col-span-2",
      "pl-5",
    );
    expect(parentRow?.querySelector(".sub-activity-line")).toHaveClass(
      "relative",
      "before:left-[-12px]",
    );
    const childWithoutPlaceLine = parentRow?.querySelector(
      '[data-sub-item-id="child-without-place"]',
    );
    expect(childWithoutPlaceLine).not.toHaveTextContent("@");
    expect(childWithoutPlaceLine?.querySelectorAll("input")).toHaveLength(2);
    expect(
      within(childWithoutPlaceLine as HTMLElement).getByLabelText(
        /แก้ไขสถานที่|Edit place/i,
      ),
    ).toHaveAttribute("placeholder", "");
    expect(document.querySelector('[data-item-id="child-activity"]')).not.toBeInTheDocument();

    await user.click(
      within(parentRow as HTMLElement).getByRole("button", {
        name: /Add sub-activity|เพิ่มกิจกรรมย่อย/i,
      }),
    );
    expect(onAddSubActivity).toHaveBeenCalledWith("parent-activity");
  });

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

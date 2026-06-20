import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { tripFixture } from "@/src/trip/trip-fixtures";
import {
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


});

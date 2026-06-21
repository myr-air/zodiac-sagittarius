import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderSmartItineraryTable } from "@/src/features/itinerary/testing";
import { tripFixture } from "@/src/trip/testing/fixtures/trip-fixtures";

const renderTable = renderSmartItineraryTable;

describe("SmartItineraryTable activity editing", () => {
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
    expect(
      screen.getByRole("listbox", { name: /แก้ไขประเภท Hotel transfer/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("listbox", { name: /เดินทาง options/i }),
    ).toBeInTheDocument();

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
    expect(
      screen.getByRole("listbox", { name: /เดินทาง options/i }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /แท็กซี่/i }));

    expect(onUpdateItemInline).toHaveBeenCalledWith(
      "mobile-travel-subtype-row",
      {
        activityType: "travel",
        activitySubtype: "taxi",
        details: expect.objectContaining({ mode: "bus", subtype: "taxi" }),
      },
    );
  });
});

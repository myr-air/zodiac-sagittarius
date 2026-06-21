import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { tripFixture } from "@/src/trip/trip-fixtures";
import { renderSmartItineraryTable } from "@/src/features/itinerary/testing";

const renderTable = renderSmartItineraryTable;

describe("SmartItineraryTable sub-activities", () => {
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

});

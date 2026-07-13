import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  buildItineraryItem,
  getItineraryItemRow,
  getSubItineraryItemLine,
  queryItineraryItemRow,
  renderSmartItineraryTable,
} from "@/src/features/itinerary/testing";

const renderTable = renderSmartItineraryTable;

describe("SmartItineraryTable sub-activities", () => {
  it("lets sub-activities switch from travel to another type and default", async () => {
    const user = userEvent.setup();
    const onUpdateItemInline = vi.fn();
    const parent = buildItineraryItem({
      id: "parent-type-switch",
      activity: "Parent route",
      day: "2026-06-19",
      sortOrder: 10,
    });
    const child = buildItineraryItem({
      id: "child-type-switch",
      parentItemId: "parent-type-switch",
      activity: "Airport transfer",
      activityType: "travel" as const,
      activitySubtype: "bus" as const,
      details: {
        mode: "bus",
      },
      day: "2026-06-19",
      sortOrder: 11,
    });

    renderTable({
      items: [parent, child],
      graphItems: [parent, child],
      selectedItemId: parent.id,
      onUpdateItemInline,
    });

    const parentRow = getItineraryItemRow(parent.id);
    await user.click(
      within(parentRow).getAllByRole("button", {
        name: /Sub-activities for Parent route/i,
      })[0],
    );
    const childLine = within(parentRow)
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
    const parent = buildItineraryItem({
      id: "parent-activity",
      activity: "Parent route",
      place: "",
      day: "2026-06-19",
      sortOrder: 10,
    });
    const child = buildItineraryItem({
      id: "child-activity",
      parentItemId: "parent-activity",
      activity: "Buy Octopus card",
      place: "Airport station",
      day: "2026-06-19",
      sortOrder: 11,
    });
    const childWithoutPlace = buildItineraryItem({
      id: "child-without-place",
      parentItemId: "parent-activity",
      activity: "Check stored value",
      activityType: "food" as const,
      place: "",
      day: "2026-06-19",
      sortOrder: 12,
    });

    renderTable({
      items: [parent, child, childWithoutPlace],
      graphItems: [parent, child, childWithoutPlace],
      selectedItemId: "parent-activity",
      onAddSubActivity,
    });

    const parentRow = getItineraryItemRow(parent.id);
    expect(within(parentRow).getByDisplayValue("Parent route")).toBeInTheDocument();
    const parentBody = parentRow.querySelector(".activity-cell > div:nth-of-type(2)");
    expect(parentBody).not.toHaveTextContent("@");
    within(parentBody as HTMLElement)
      .getAllByLabelText(/แก้ไขสถานที่|Edit place/i)
      .forEach((placeInput) => {
        expect(placeInput).toHaveAttribute("placeholder", "");
      });
    await user.click(
      within(parentRow).getAllByRole("button", {
        name: /Sub-activities for Parent route/i,
      })[0],
    );
    expect(within(parentRow).getByDisplayValue("Buy Octopus card")).toBeInTheDocument();
    expect(parentRow.querySelector(".sub-activity-list")).toHaveClass(
      "relative",
      "col-start-2",
      "col-span-2",
      "pl-5",
    );
    expect(parentRow.querySelector(".sub-activity-line")).toHaveClass(
      "relative",
      "before:left-[-12px]",
    );
    const childWithoutPlaceLine = getSubItineraryItemLine(childWithoutPlace.id);
    expect(childWithoutPlaceLine).not.toHaveTextContent("@");
    expect(childWithoutPlaceLine?.querySelectorAll("input")).toHaveLength(2);
    expect(
      within(childWithoutPlaceLine as HTMLElement).getByLabelText(
        /แก้ไขสถานที่|Edit place/i,
      ),
    ).toHaveAttribute("placeholder", "");
    expect(queryItineraryItemRow(child.id)).not.toBeInTheDocument();

    await user.click(
      within(parentRow).getByRole("button", {
        name: /Add sub-activity|เพิ่มกิจกรรมย่อย/i,
      }),
    );
    expect(onAddSubActivity).toHaveBeenCalledWith("parent-activity");
  });

});

import { within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { tripFixture } from "@/src/trip/trip-fixtures";
import {
  renderSmartItineraryTable,
} from "@/src/features/itinerary/testing";

const renderTable = renderSmartItineraryTable;

describe("SmartItineraryTable", () => {
  it("shows travel from/to details and creates booking drafts from the mode icon", async () => {
    const user = userEvent.setup();
    const onAddBookingForItem = vi.fn();
    const item = {
      ...tripFixture.planItems[0],
      id: "travel-flight-row",
      activity: "Airport transfer",
      activityType: "travel" as const,
      place: "HKG",
      transportation: "",
      details: {
        ...tripFixture.planItems[0].details,
        from: "BKK",
        mode: "flight",
        to: "HKG",
      },
    };

    renderTable({
      items: [item],
      graphItems: [item],
      selectedItemId: item.id,
      onAddBookingForItem,
    });

    const row = document.querySelector<HTMLTableRowElement>(
      '[data-item-id="travel-flight-row"]',
    );
    expect(row).not.toBeNull();
    expect(row).toHaveTextContent("From");
    expect(row).toHaveTextContent("To");
    expect(row).not.toHaveTextContent("@");
    expect(within(row as HTMLElement).getByDisplayValue("BKK")).toBeInTheDocument();
    expect(within(row as HTMLElement).getByDisplayValue("HKG")).toBeInTheDocument();

    const bookingButton = within(row as HTMLElement).getAllByRole("button", {
        name: /สร้าง booking draft แบบ เครื่องบิน สำหรับ Airport transfer/i,
      })[0];
    expect(bookingButton).toHaveClass("text-(--color-text-muted)");

    await user.click(bookingButton);

    expect(onAddBookingForItem).toHaveBeenCalledWith("travel-flight-row", "flight");
  });

});

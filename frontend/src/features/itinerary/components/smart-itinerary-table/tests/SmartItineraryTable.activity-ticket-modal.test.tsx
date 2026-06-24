import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  buildBusTravelItineraryItem,
  buildFlightTravelItineraryItem,
  buildSharedFlightBookingDoc,
  getItineraryItemRow,
  renderSmartItineraryTable,
} from "@/src/features/itinerary/testing";

const renderTable = renderSmartItineraryTable;

describe("SmartItineraryTable activity ticket modal", () => {
  it("opens a ticket modal from the mode icon and reuses an existing ticket", async () => {
    const user = userEvent.setup();
    const onSaveBookingForItem = vi.fn();
    const flightItem = buildFlightTravelItineraryItem();
    const busItem = buildBusTravelItineraryItem();

    renderTable({
      items: [flightItem, busItem],
      graphItems: [flightItem, busItem],
      selectedItemId: flightItem.id,
      bookingDocs: [buildSharedFlightBookingDoc([busItem.id])],
      onSaveBookingForItem,
    });

    const row = getItineraryItemRow(flightItem.id);
    const linkedBusRow = getItineraryItemRow(busItem.id);
    expect(
      within(linkedBusRow).getAllByRole("button", {
        name: /สร้าง booking draft แบบ รถบัส สำหรับ Terminal shuttle/i,
      })[0],
    ).toHaveClass("text-(--color-route)");

    await user.click(
      within(row).getAllByRole("button", {
        name: /สร้าง booking draft แบบ เครื่องบิน สำหรับ Airport transfer/i,
      })[0],
    );
    const dialog = await screen.findByRole("dialog", {
      name: /ตั๋วสำหรับ Airport transfer/i,
    });

    await user.click(
      within(dialog).getByRole("button", { name: /ใช้ตั๋วเดิม/i }),
    );
    expect(within(dialog).getByText("CX shared flight ticket")).toBeInTheDocument();
    const terminalShuttleCheckbox = within(dialog)
      .getAllByLabelText(/Terminal shuttle/i)
      .find(
        (element): element is HTMLInputElement =>
          element instanceof HTMLInputElement && element.type === "checkbox",
      );
    expect(terminalShuttleCheckbox).toBeChecked();

    await user.clear(within(dialog).getByLabelText("เลข booking / ticket"));
    await user.type(within(dialog).getByLabelText("เลข booking / ticket"), "CX5678");
    await user.click(within(dialog).getByRole("button", { name: /บันทึกตั๋ว/i }));

    await waitFor(() => {
      expect(onSaveBookingForItem).toHaveBeenCalledWith(
        expect.objectContaining({
          bookingDocId: "booking-shared-flight",
          confirmationCode: "CX5678",
          itemId: flightItem.id,
          relatedItineraryItemIds: [busItem.id, flightItem.id],
          template: "flight",
          type: "flight",
        }),
      );
    });
  });

  it("unlinks the current activity from an existing ticket without deleting the ticket", async () => {
    const user = userEvent.setup();
    const onSaveBookingForItem = vi.fn();
    const onUnlinkBookingForItem = vi.fn();
    const flightItem = buildFlightTravelItineraryItem();
    const busItem = buildBusTravelItineraryItem();

    renderTable({
      items: [flightItem, busItem],
      graphItems: [flightItem, busItem],
      selectedItemId: flightItem.id,
      bookingDocs: [buildSharedFlightBookingDoc([flightItem.id, busItem.id])],
      onSaveBookingForItem,
      onUnlinkBookingForItem,
    });

    const row = getItineraryItemRow(flightItem.id);
    const bookingButton = within(row).getAllByRole("button", {
      name: /สร้าง booking draft แบบ เครื่องบิน สำหรับ Airport transfer/i,
    })[0];
    expect(bookingButton).toHaveClass("text-(--color-route)");

    await user.click(bookingButton);
    const dialog = await screen.findByRole("dialog", {
      name: /ตั๋วสำหรับ Airport transfer/i,
    });

    expect(within(dialog).getByText("CX shared flight ticket")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: /ยกเลิก link/i }));

    await waitFor(() => {
      expect(onUnlinkBookingForItem).toHaveBeenCalledWith(
        "booking-shared-flight",
        flightItem.id,
      );
    });
    expect(
      screen.queryByRole("dialog", {
        name: /ตั๋วสำหรับ Airport transfer/i,
      }),
    ).not.toBeInTheDocument();
  });
});

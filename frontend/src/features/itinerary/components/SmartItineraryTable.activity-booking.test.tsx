import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { tripFixture } from "@/src/trip/trip-fixtures";
import {
  buildBookingDoc,
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

  it("opens a ticket modal from the mode icon and reuses an existing ticket", async () => {
    const user = userEvent.setup();
    const onSaveBookingForItem = vi.fn();
    const flightItem = {
      ...tripFixture.planItems[0],
      id: "travel-flight-row",
      activity: "Airport transfer",
      activityType: "travel" as const,
      place: "HKG",
      startTime: "09:00",
      endTime: "11:30",
      details: {
        ...tripFixture.planItems[0].details,
        from: "BKK",
        mode: "flight",
        to: "HKG",
      },
    };
    const busItem = {
      ...tripFixture.planItems[1],
      id: "bus-leg-row",
      activity: "Terminal shuttle",
      activityType: "travel" as const,
      details: {
        ...tripFixture.planItems[1].details,
        mode: "bus",
      },
    };

    renderTable({
      items: [flightItem, busItem],
      graphItems: [flightItem, busItem],
      selectedItemId: flightItem.id,
      bookingDocs: [
        buildBookingDoc({
          id: "booking-shared-flight",
          tripId: tripFixture.trip.id,
          tripPlanId: tripFixture.trip.activePlanVariantId,
          type: "flight",
          title: "CX shared flight ticket",
          status: "booked",
          ownerMemberId: tripFixture.trip.members[0].id,
          providerName: "Cathay Pacific",
          confirmationCode: "CX1234",
          startsAt: "2026-06-19T09:00:00",
          endsAt: "2026-06-19T11:30:00",
          timezone: tripFixture.trip.defaultTimezone,
          travelerIds: [tripFixture.trip.members[0].id],
          relatedItineraryItemIds: [busItem.id],
          notes: "Shared ticket",
          createdBy: tripFixture.trip.members[0].id,
        }),
      ],
      onSaveBookingForItem,
    });

    const row = document.querySelector<HTMLTableRowElement>(
      '[data-item-id="travel-flight-row"]',
    );
    expect(row).not.toBeNull();
    const linkedBusRow = document.querySelector<HTMLTableRowElement>(
      '[data-item-id="bus-leg-row"]',
    );
    expect(linkedBusRow).not.toBeNull();
    expect(
      within(linkedBusRow as HTMLElement).getAllByRole("button", {
        name: /สร้าง booking draft แบบ รถบัส สำหรับ Terminal shuttle/i,
      })[0],
    ).toHaveClass("text-(--color-route)");

    await user.click(
      within(row as HTMLElement).getAllByRole("button", {
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
    const flightItem = {
      ...tripFixture.planItems[0],
      id: "travel-flight-row",
      activity: "Airport transfer",
      activityType: "travel" as const,
      place: "HKG",
      startTime: "09:00",
      endTime: "11:30",
      details: {
        ...tripFixture.planItems[0].details,
        from: "BKK",
        mode: "flight",
        to: "HKG",
      },
    };
    const busItem = {
      ...tripFixture.planItems[1],
      id: "bus-leg-row",
      activity: "Terminal shuttle",
      activityType: "travel" as const,
      details: {
        ...tripFixture.planItems[1].details,
        mode: "bus",
      },
    };

    renderTable({
      items: [flightItem, busItem],
      graphItems: [flightItem, busItem],
      selectedItemId: flightItem.id,
      bookingDocs: [
        buildBookingDoc({
          id: "booking-shared-flight",
          tripId: tripFixture.trip.id,
          tripPlanId: tripFixture.trip.activePlanVariantId,
          type: "flight",
          title: "CX shared flight ticket",
          status: "booked",
          ownerMemberId: tripFixture.trip.members[0].id,
          providerName: "Cathay Pacific",
          confirmationCode: "CX1234",
          startsAt: "2026-06-19T09:00:00",
          endsAt: "2026-06-19T11:30:00",
          timezone: tripFixture.trip.defaultTimezone,
          travelerIds: [tripFixture.trip.members[0].id],
          relatedItineraryItemIds: [flightItem.id, busItem.id],
          notes: "Shared ticket",
          createdBy: tripFixture.trip.members[0].id,
        }),
      ],
      onSaveBookingForItem,
      onUnlinkBookingForItem,
    });

    const row = document.querySelector<HTMLTableRowElement>(
      '[data-item-id="travel-flight-row"]',
    );
    expect(row).not.toBeNull();
    const bookingButton = within(row as HTMLElement).getAllByRole("button", {
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

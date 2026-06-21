import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { buildBookingDoc } from "@/src/features/itinerary/testing";
import { tripFixture } from "@/src/trip/testing/fixtures/trip-fixtures";
import {
  renderContextRail,
  selectedContextRailItem,
} from "../testing/support/context-rail-render";

describe("ContextRail booking section", () => {
  it("shows booking docs linked to the selected itinerary item", async () => {
    const onChangeBookingDocType = vi.fn();
    const onChangeBookingDocQuickFields = vi.fn();
    renderContextRail({
      onChangeBookingDocType,
      onChangeBookingDocQuickFields,
      bookingDocs: [
        buildBookingDoc({
          id: "booking-dimdim-1",
          tripId: tripFixture.trip.id,
          tripPlanId: selectedContextRailItem.planVariantId,
          type: "activity_ticket",
          title: "Dim Dim Sum reservation",
          status: "booked",
          ownerMemberId: tripFixture.currentMembers.owner.id,
          providerName: "Dim Dim Sum",
          confirmationCode: "DDS-42",
          timezone: "Asia/Hong_Kong",
          travelerIds: [tripFixture.currentMembers.owner.id],
          relatedItineraryItemIds: [selectedContextRailItem.id],
          notes: "Window table",
          createdBy: tripFixture.currentMembers.owner.id,
        }),
        buildBookingDoc({
          id: "booking-other-1",
          tripId: tripFixture.trip.id,
          tripPlanId: selectedContextRailItem.planVariantId,
          type: "other",
          title: "Other stop ticket",
          status: "booked",
          ownerMemberId: tripFixture.currentMembers.owner.id,
          timezone: "Asia/Hong_Kong",
          relatedItineraryItemIds: ["other-item"],
          createdBy: tripFixture.currentMembers.owner.id,
        }),
      ],
    });

    await userEvent.click(screen.getByRole("tab", { name: "การจอง" }));
    const bookingPanel = screen.getByRole("region", {
      name: "การจองและการเตรียมตัวของจุดนี้",
    });
    expect(
      within(bookingPanel).getByText("Dim Dim Sum reservation"),
    ).toBeInTheDocument();
    expect(within(bookingPanel).getByText("การจอง · booked")).toBeInTheDocument();
    const typeSelect = within(bookingPanel).getByLabelText(
      "ประเภทการจองของ Dim Dim Sum reservation",
    );
    expect(typeSelect).toHaveValue("activity_ticket");
    fireEvent.change(typeSelect, { target: { value: "other" } });
    expect(onChangeBookingDocType).toHaveBeenCalledWith(
      "booking-dimdim-1",
      "other",
    );
    fireEvent.change(
      within(bookingPanel).getByLabelText(
        "ผู้ให้บริการของ Dim Dim Sum reservation",
      ),
      { target: { value: "Updated supplier" } },
    );
    fireEvent.blur(
      within(bookingPanel).getByLabelText(
        "ผู้ให้บริการของ Dim Dim Sum reservation",
      ),
    );
    expect(onChangeBookingDocQuickFields).toHaveBeenCalledWith(
      "booking-dimdim-1",
      { providerName: "Updated supplier" },
    );
    fireEvent.change(
      within(bookingPanel).getByLabelText(
        "รหัสอ้างอิงของ Dim Dim Sum reservation",
      ),
      { target: { value: "DDS-99" } },
    );
    fireEvent.blur(
      within(bookingPanel).getByLabelText(
        "รหัสอ้างอิงของ Dim Dim Sum reservation",
      ),
    );
    expect(onChangeBookingDocQuickFields).toHaveBeenCalledWith(
      "booking-dimdim-1",
      { confirmationCode: "DDS-99" },
    );
    expect(
      within(bookingPanel).queryByText("Other stop ticket"),
    ).not.toBeInTheDocument();
  });
});

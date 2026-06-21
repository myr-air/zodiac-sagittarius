import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { findBookingDocRelations } from "@/src/trip/booking-docs";
import { seedTrip } from "@/src/trip/seed";
import { bookingCopy } from "../content/BookingsDocsPage.copy";
import { BookingInspector } from "./BookingInspector";
import {
  bookingDocTestTasks,
  bookingFlightTestDoc,
} from "../tests/bookings-docs-test-fixtures";

describe("BookingInspector", () => {
  it("renders an empty inspector when no booking is selected", () => {
    render(
      <BookingInspector
        booking={null}
        canEdit={false}
        copy={bookingCopy.en}
        mobileOpen={false}
        onClose={() => undefined}
        onDelete={() => undefined}
        onEdit={() => undefined}
        relations={null}
      />,
    );

    expect(screen.getByLabelText("Booking details")).toHaveClass("booking-inspector", "max-[1199px]:translate-y-full");
    expect(screen.getByText("No booking selected")).toBeInTheDocument();
  });

  it("renders selected booking facts, links, and relation counts", () => {
    const booking = bookingFlightTestDoc;
    const relations = findBookingDocRelations(booking, seedTrip, bookingDocTestTasks);

    render(
      <BookingInspector
        booking={booking}
        canEdit={false}
        copy={bookingCopy.en}
        mobileOpen
        onClose={() => undefined}
        onDelete={() => undefined}
        onEdit={() => undefined}
        relations={relations}
      />,
    );

    expect(screen.getByLabelText("Booking details")).toHaveClass("max-[1199px]:translate-y-0");
    expect(screen.getByRole("heading", { name: "Bangkok to Hong Kong flight" })).toBeInTheDocument();
    expect(screen.getByText("Flight")).toBeInTheDocument();
    expect(screen.getByText("Confirmation: QR349-HK")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open Airline booking" })).toHaveAttribute("href", "https://example.com/airline/booking/QR349-HK");
    expect(screen.getByText("2 itinerary links")).toBeInTheDocument();
    expect(screen.getByText("Demo Traveler, Travel Mate, Explorer Friend")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit booking" })).not.toBeInTheDocument();
  });

  it("shows edit controls when allowed and reports inspector actions", () => {
    const booking = bookingFlightTestDoc;
    const relations = findBookingDocRelations(booking, seedTrip, bookingDocTestTasks);
    const onClose = vi.fn();
    const onDelete = vi.fn();
    const onEdit = vi.fn();

    render(
      <BookingInspector
        booking={booking}
        canEdit
        copy={bookingCopy.en}
        mobileOpen
        onClose={onClose}
        onDelete={onDelete}
        onEdit={onEdit}
        relations={relations}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Edit booking" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete booking" }));
    fireEvent.click(screen.getByRole("button", { name: "Close booking preview" }));

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

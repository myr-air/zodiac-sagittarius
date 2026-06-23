import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { seedTrip } from "@/src/trip/seed";
import { bookingCopy } from "../../content/BookingsDocsPage.copy";
import {
  bookingFlightTestDoc,
  bookingPassportTestDoc,
} from "../../testing/fixtures/bookings-docs-test-fixtures";
import { BookingFileList } from "../BookingFileList";

describe("BookingFileList", () => {
  it("renders visible and locked records with row actions delegated", () => {
    const onSelectBooking = vi.fn();
    const onEditBooking = vi.fn();
    const onDeleteBooking = vi.fn();

    render(
      <BookingFileList
        canEditBookings
        copy={bookingCopy.en}
        folderDocs={[bookingFlightTestDoc]}
        lockedDocs={[bookingPassportTestDoc]}
        selectedBookingId={bookingFlightTestDoc.id}
        trip={seedTrip}
        onDeleteBooking={onDeleteBooking}
        onEditBooking={onEditBooking}
        onSelectBooking={onSelectBooking}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Select Bangkok to Hong Kong flight" }));
    fireEvent.click(screen.getByRole("button", { name: "Edit booking" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete booking" }));

    expect(screen.getByText("Locked sensitive record")).toBeInTheDocument();
    expect(screen.getByText("Passport")).toBeInTheDocument();
    expect(onSelectBooking).toHaveBeenCalledWith(bookingFlightTestDoc.id);
    expect(onEditBooking).toHaveBeenCalledWith(bookingFlightTestDoc);
    expect(onDeleteBooking).toHaveBeenCalledWith(bookingFlightTestDoc);
  });

  it("renders the booking empty state when the folder has no visible docs", () => {
    render(
      <BookingFileList
        canEditBookings={false}
        copy={bookingCopy.en}
        folderDocs={[]}
        lockedDocs={[]}
        trip={seedTrip}
        onDeleteBooking={() => undefined}
        onEditBooking={() => undefined}
        onSelectBooking={() => undefined}
      />,
    );

    expect(screen.getByText("No matching files")).toBeInTheDocument();
    expect(screen.getByText("No items in this view. Try another folder, status, or search term.")).toBeInTheDocument();
  });
});

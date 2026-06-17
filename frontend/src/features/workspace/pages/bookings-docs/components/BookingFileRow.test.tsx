import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { seedTrip } from "@/src/trip/seed";
import { bookingCopy } from "../BookingsDocsPage.copy";
import { BookingFileRow } from "./BookingFileRow";

describe("BookingFileRow", () => {
  it("renders selected booking details and row actions", () => {
    const booking = seedTrip.bookingDocs!.find((doc) => doc.id === "booking-flight-bkk-hkg")!;
    const onSelect = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    const { container } = render(
      <BookingFileRow
        doc={booking}
        copy={bookingCopy.en}
        trip={seedTrip}
        selected
        canEdit
        onSelect={onSelect}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );

    expect(container.querySelector(".booking-file-row")).toHaveClass("bg-(--color-primary-soft)");
    expect(screen.getByRole("button", { name: "Select Bangkok to Hong Kong flight" })).toBeInTheDocument();
    expect(screen.getByText("Flight · Confirmation: QR349-HK")).toBeInTheDocument();
    expect(screen.getByText("Cathay Travel")).toBeInTheDocument();
    expect(screen.getByText(/เดินทางออกจากกรุงเทพฯ .*Hong Kong International Airport/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open Airline booking" })).toHaveAttribute("href", "https://example.com/airline/booking/QR349-HK");

    fireEvent.click(screen.getByRole("button", { name: "Select Bangkok to Hong Kong flight" }));
    fireEvent.click(screen.getByRole("button", { name: "Edit booking" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete booking" }));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("renders fallback provider, date, link, and hides edit actions when read-only", () => {
    const booking = {
      ...seedTrip.bookingDocs!.find((doc) => doc.id === "booking-flight-bkk-hkg")!,
      confirmationCode: null,
      externalLinks: [],
      providerName: null,
      relatedItineraryItemIds: [],
      startsAt: null,
    };

    render(
      <BookingFileRow
        doc={booking}
        copy={bookingCopy.en}
        trip={seedTrip}
        selected={false}
        canEdit={false}
        onSelect={() => undefined}
        onEdit={() => undefined}
        onDelete={() => undefined}
      />,
    );

    expect(screen.getByText("No date")).toBeInTheDocument();
    expect(screen.getByText("No provider")).toBeInTheDocument();
    expect(screen.getByText("No linked stop")).toBeInTheDocument();
    expect(screen.getByTitle("No link")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit booking" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete booking" })).not.toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { seedTrip } from "@/src/trip/seed";
import { bookingCopy } from "./BookingsDocsPage.copy";
import { BookingsDocsHeader } from "./BookingsDocsHeader";

describe("BookingsDocsHeader", () => {
  it("renders trip metadata and add action when editable", async () => {
    const user = userEvent.setup();
    const onAddBooking = vi.fn();

    render(
      <BookingsDocsHeader
        canEditBookings
        copy={bookingCopy.en}
        locale="en"
        onAddBooking={onAddBooking}
        recordCount={5}
        trip={seedTrip}
      />,
    );

    expect(screen.getByRole("heading", { name: "Bookings & Docs" })).toHaveClass("text-[24px]");
    expect(screen.getByText("Hong Kong + Shenzhen Trip")).toBeInTheDocument();
    expect(screen.getByText("Jun 18–23, 2026")).toBeInTheDocument();
    expect(screen.getByText("5 records")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add booking" }));
    expect(onAddBooking).toHaveBeenCalledTimes(1);
  });

  it("omits the add action in read-only mode", () => {
    render(
      <BookingsDocsHeader
        canEditBookings={false}
        copy={bookingCopy.en}
        locale="en"
        onAddBooking={() => undefined}
        recordCount={5}
        trip={seedTrip}
      />,
    );

    expect(screen.queryByRole("button", { name: "Add booking" })).not.toBeInTheDocument();
  });
});

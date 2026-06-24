import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { seedTrip } from "@/src/trip/seed";
import { bookingCopy } from "../../content/BookingsDocsPage.copy";
import {
  bookingDocTestTasks,
  bookingFlightTestDoc,
} from "../../testing/fixtures/bookings-docs-test-fixtures";
import { BookingDialogLayer } from "../BookingDialogLayer";

const baseProps = {
  copy: bookingCopy.en,
  deleteBooking: null,
  dialogBooking: null,
  tasks: bookingDocTestTasks,
  trip: seedTrip,
  onCancelDelete: vi.fn(),
  onCancelDialog: vi.fn(),
  onConfirmDelete: vi.fn(),
  onSubmitBooking: vi.fn(),
};

describe("BookingDialogLayer", () => {
  it("does not render dialogs without active booking targets", () => {
    render(<BookingDialogLayer {...baseProps} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders the booking form dialog for a new booking target", () => {
    render(<BookingDialogLayer {...baseProps} dialogBooking="new" />);

    expect(
      screen.getByRole("dialog", { name: /add booking/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^title$/i)).toBeInTheDocument();
  });

  it("renders delete confirmation for a delete booking target", () => {
    render(
      <BookingDialogLayer
        {...baseProps}
        deleteBooking={bookingFlightTestDoc}
      />,
    );

    expect(
      screen.getByRole("dialog", { name: /delete booking/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Bangkok to Hong Kong flight/i),
    ).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { bookingCopy } from "../../content/BookingsDocsPage.copy";
import { BookingStatusBadge } from "../BookingStatusBadge";

describe("BookingStatusBadge", () => {
  it("renders localized status copy with the shared badge frame", () => {
    render(<BookingStatusBadge copy={bookingCopy.en} status="needs_action" />);

    expect(screen.getByText("Needs Action")).toHaveClass(
      "inline-flex",
      "border-(--color-warning-border)",
      "bg-(--color-warning-soft)",
      "text-(--color-warning-strong)",
    );
  });

  it("accepts caller layout classes without duplicating tone logic", () => {
    render(
      <BookingStatusBadge
        className="justify-self-end"
        copy={bookingCopy.en}
        status="confirmed"
      />,
    );

    expect(screen.getByText("Confirmed")).toHaveClass(
      "justify-self-end",
      "border-(--color-success-border)",
      "bg-(--color-success-soft)",
    );
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { bookingCopy } from "../../content/BookingsDocsPage.copy";
import { BookingTypeLabel, BookingTypeMark } from "../BookingTypeDisplay";

describe("BookingTypeDisplay", () => {
  it("renders the localized booking type label", () => {
    render(<BookingTypeLabel copy={bookingCopy.en} type="public_transport" />);

    expect(screen.getByText("Public Transport")).toBeInTheDocument();
  });

  it("renders the shared icon tone for the booking type", () => {
    const { container } = render(<BookingTypeMark className="shrink-0" type="passport" />);

    expect(container.firstChild).toHaveClass(
      "shrink-0",
      "border-(--color-primary-border)",
      "bg-(--color-primary-soft)",
      "text-(--color-primary-strong)",
    );
  });
});

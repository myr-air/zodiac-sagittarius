import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BookingExternalLinkAction } from "../BookingExternalLinkAction";

const link = {
  id: "link-airline",
  label: "Airline booking",
  url: "https://example.com/airline/booking/QR349-HK",
};

describe("BookingExternalLinkAction", () => {
  it("renders compact icon links for booking rows", () => {
    render(
      <BookingExternalLinkAction
        link={link}
        openLabel="Open Airline booking"
        variant="icon"
      />,
    );

    const action = screen.getByRole("link", { name: "Open Airline booking" });
    expect(action).toHaveAttribute("href", link.url);
    expect(action).toHaveClass("grid", "size-8");
    expect(action.querySelector(".icon")).toBeInTheDocument();
  });

  it("renders inline links for the booking inspector", () => {
    render(
      <BookingExternalLinkAction
        link={link}
        openLabel="Open Airline booking"
        variant="inline"
      />,
    );

    const action = screen.getByRole("link", { name: "Open Airline booking" });
    expect(action).toHaveAttribute("href", link.url);
    expect(action).toHaveClass("inline-flex", "min-h-9");
    expect(action).toHaveTextContent("Open Airline booking");
  });
});

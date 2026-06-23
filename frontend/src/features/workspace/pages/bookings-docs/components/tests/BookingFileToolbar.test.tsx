import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { bookingCopy } from "../../content/BookingsDocsPage.copy";
import { BookingFileToolbar } from "../BookingFileToolbar";

describe("BookingFileToolbar", () => {
  it("updates query and status filter through the extracted toolbar controls", async () => {
    const user = userEvent.setup();
    const onQueryChange = vi.fn();
    const onStatusFilterChange = vi.fn();
    const onToggleStatusMenu = vi.fn();

    render(
      <BookingFileToolbar
        copy={bookingCopy.en}
        query="flight"
        statusFilter="confirmed"
        statusMenuOpen
        onQueryChange={onQueryChange}
        onStatusFilterChange={onStatusFilterChange}
        onToggleStatusMenu={onToggleStatusMenu}
      />,
    );

    fireEvent.change(screen.getByRole("searchbox", { name: "Search bookings, docs, links" }), {
      target: { value: "flight hk" },
    });
    await user.click(screen.getByRole("button", { name: "Status: Confirmed" }));
    await user.click(screen.getByRole("option", { name: "Paid" }));

    expect(onQueryChange).toHaveBeenLastCalledWith("flight hk");
    expect(onToggleStatusMenu).toHaveBeenCalledTimes(1);
    expect(onStatusFilterChange).toHaveBeenCalledWith("paid");
  });
});

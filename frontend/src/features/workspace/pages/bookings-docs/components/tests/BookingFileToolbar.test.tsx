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

    render(
      <BookingFileToolbar
        copy={bookingCopy.en}
        query="flight"
        statusFilter="confirmed"
        onQueryChange={onQueryChange}
        onStatusFilterChange={onStatusFilterChange}
      />,
    );

    fireEvent.change(screen.getByRole("searchbox", { name: "Search bookings, docs, links" }), {
      target: { value: "flight hk" },
    });
    await user.click(screen.getByRole("button", { name: "Status: Confirmed" }));
    expect(
      screen.getByRole("listbox", { name: "Status: Confirmed" }),
    ).toBeInTheDocument();
    await user.click(screen.getByText("Paid"));

    expect(onQueryChange).toHaveBeenLastCalledWith("flight hk");
    expect(onStatusFilterChange).toHaveBeenCalledWith("paid");
  });
});

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { bookingCopy } from "../../content/BookingsDocsPage.copy";
import { BookingDeleteDialog } from "../BookingDeleteDialog";

describe("BookingDeleteDialog", () => {
  it("renders the delete prompt and reports cancel or confirm actions", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const onConfirm = vi.fn();

    render(
      <BookingDeleteDialog
        bookingTitle="Bangkok to Hong Kong flight"
        copy={bookingCopy.en}
        onCancel={onCancel}
        onConfirm={onConfirm}
      />,
    );

    const dialog = screen.getByRole("dialog", { name: "Delete booking" });
    expect(dialog).toHaveClass("delete-confirm-dialog");
    expect(screen.getByText("Delete Bangkok to Hong Kong flight? Related itinerary, todo, and expense records will stay in place.")).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    await user.click(within(dialog).getByRole("button", { name: "Delete booking" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});

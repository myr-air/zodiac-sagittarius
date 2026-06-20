import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { seedTrip } from "@/src/trip/seed";
import type { BookingDocInput } from "./BookingsDocsPage";
import { renderBookingsDocsPage } from "./BookingsDocsPage.test-support";

describe("BookingsDocsPage mutations", () => {
  it("submits new booking docs and edits existing records", async () => {
    const user = userEvent.setup();
    const onCreateBookingDoc = vi.fn();
    const onUpdateBookingDoc = vi.fn();
    renderBookingsDocsPage({ onCreateBookingDoc, onUpdateBookingDoc });

    await user.click(screen.getAllByRole("button", { name: "Add booking" })[0]);
    let dialog = screen.getByRole("dialog", { name: "Add booking" });
    expect(dialog).toHaveClass("shadow-[0_10px_18px_rgb(15_23_42_/_0.14)]");
    expect(dialog.className).not.toContain("0_14px_34px");
    fireEvent.change(within(dialog).getByLabelText("Title"), { target: { value: "Airport Express pass" } });
    fireEvent.change(within(dialog).getByLabelText("Type"), { target: { value: "public_transport" } });
    fireEvent.change(within(dialog).getByLabelText("Status"), { target: { value: "booked" } });
    fireEvent.change(within(dialog).getByLabelText("External link"), { target: { value: "https://drive.google.com/airport-express" } });
    await user.click(within(dialog).getByRole("checkbox", { name: "Travel Mate" }));
    await user.click(within(dialog).getByRole("checkbox", { name: /2026-06-18 · เดินทางออกจากกรุงเทพฯ/i }));
    await user.click(within(dialog).getByRole("checkbox", { name: /จอง Peak Tram/i }));
    await user.click(within(dialog).getByRole("checkbox", { name: "Peak Tram tickets" }));
    await user.click(within(dialog).getByRole("button", { name: "Save booking" }));

    expect(onCreateBookingDoc).toHaveBeenCalledWith(expect.objectContaining<Partial<BookingDocInput>>({
      title: "Airport Express pass",
      type: "public_transport",
      status: "booked",
      travelerIds: ["member-aom", "member-beam"],
      externalLinks: [expect.objectContaining({ url: "https://drive.google.com/airport-express" })],
      relatedItineraryItemIds: ["item-flight-bkk-hkg"],
      relatedTaskIds: ["task-peak-tram"],
      relatedExpenseIds: ["expense-peak-tram"],
    }));

    await user.click(screen.getByRole("button", { name: /Transport/i }));
    await user.click(screen.getAllByRole("button", { name: "Edit booking" })[0]);
    dialog = screen.getByRole("dialog", { name: "Edit booking" });
    fireEvent.change(within(dialog).getByLabelText("Title"), { target: { value: "Updated flight booking" } });
    await user.click(within(dialog).getByRole("button", { name: "Save booking" }));

    expect(onUpdateBookingDoc).toHaveBeenCalledWith(seedTrip.bookingDocs![0].id, expect.objectContaining({
      title: "Updated flight booking",
      travelerIds: ["member-aom", "member-beam", "member-nam"],
      relatedItineraryItemIds: ["item-flight-bkk-hkg", "item-arrive-hkg"],
    }));
  });

  it("requests deletion only after confirmation", async () => {
    const user = userEvent.setup();
    const onDeleteBookingDoc = vi.fn();
    renderBookingsDocsPage({ onDeleteBookingDoc });

    await user.click(screen.getByRole("button", { name: /Transport/i }));
    await user.click(screen.getAllByRole("button", { name: "Delete booking" })[0]);
    expect(screen.getByRole("dialog", { name: "Delete booking" })).toBeInTheDocument();
    await user.click(within(screen.getByRole("dialog", { name: "Delete booking" })).getByRole("button", { name: "Cancel" }));
    expect(onDeleteBookingDoc).not.toHaveBeenCalled();

    await user.click(screen.getAllByRole("button", { name: "Delete booking" })[0]);
    await user.click(within(screen.getByRole("dialog", { name: "Delete booking" })).getByRole("button", { name: "Delete booking" }));
    expect(onDeleteBookingDoc).toHaveBeenCalledWith(seedTrip.bookingDocs![0].id);
  });
});

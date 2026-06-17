import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { seedTrip } from "@/src/trip/seed";
import type { TripTask } from "@/src/trip/types";
import { bookingCopy } from "./BookingsDocsPage.copy";
import { BookingDialog } from "./BookingDialog";

const tasks: TripTask[] = [
  { id: "task-passport-nam", title: "เพิ่มชื่อ passport ของ Explorer Friend", status: "open", visibility: "shared", kind: "booking", createdBy: "member-nam", assigneeId: "member-nam" },
  { id: "task-hotel-names", title: "ยืนยันรายชื่อผู้เข้าพักโรงแรม", status: "open", visibility: "shared", kind: "booking", createdBy: "member-beam", assigneeId: "member-beam" },
  { id: "task-peak-tram", title: "จอง Peak Tram", status: "done", visibility: "shared", kind: "booking", createdBy: "member-beam", assigneeId: "member-beam" },
];

describe("BookingDialog", () => {
  it("submits a trimmed new booking payload", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <BookingDialog
        booking={null}
        copy={bookingCopy.en}
        trip={seedTrip}
        tasks={tasks}
        onCancel={() => undefined}
        onSubmit={onSubmit}
      />,
    );

    const dialog = screen.getByRole("dialog", { name: "Add booking" });
    fireEvent.change(within(dialog).getByLabelText("Title"), { target: { value: "  Airport Express pass  " } });
    fireEvent.change(within(dialog).getByLabelText("Type"), { target: { value: "public_transport" } });
    fireEvent.change(within(dialog).getByLabelText("Status"), { target: { value: "paid" } });
    fireEvent.change(within(dialog).getByLabelText("Provider"), { target: { value: "  MTR  " } });
    fireEvent.change(within(dialog).getByLabelText("External link"), { target: { value: "  https://drive.google.com/airport-express  " } });
    fireEvent.change(within(dialog).getByLabelText("Price"), { target: { value: "880" } });
    await user.click(within(dialog).getByRole("checkbox", { name: "Travel Mate" }));
    await user.click(within(dialog).getByRole("checkbox", { name: /2026-06-18 · เดินทางออกจากกรุงเทพฯ/i }));
    await user.click(within(dialog).getByRole("checkbox", { name: /จอง Peak Tram/i }));
    await user.click(within(dialog).getByRole("checkbox", { name: "Peak Tram tickets" }));
    await user.click(within(dialog).getByRole("button", { name: "Save booking" }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      title: "Airport Express pass",
      type: "public_transport",
      status: "paid",
      providerName: "MTR",
      priceAmount: 880,
      travelerIds: ["member-aom", "member-beam"],
      relatedTaskIds: ["task-peak-tram"],
      relatedExpenseIds: ["expense-peak-tram"],
      relatedItineraryItemIds: ["item-flight-bkk-hkg"],
      externalLinks: [expect.objectContaining({
        label: "External link",
        provider: "MTR",
        url: "https://drive.google.com/airport-express",
      })],
    }));
  });

  it("preserves existing booking links, ownership, and cancel behavior", async () => {
    const user = userEvent.setup();
    const booking = seedTrip.bookingDocs!.find((doc) => doc.id === "booking-flight-bkk-hkg")!;
    const onCancel = vi.fn();
    const onSubmit = vi.fn();

    render(
      <BookingDialog
        booking={booking}
        copy={bookingCopy.en}
        trip={seedTrip}
        tasks={tasks}
        onCancel={onCancel}
        onSubmit={onSubmit}
      />,
    );

    const dialog = screen.getByRole("dialog", { name: "Edit booking" });
    fireEvent.change(within(dialog).getByLabelText("Title"), { target: { value: " Updated flight booking " } });
    await user.click(within(dialog).getByRole("button", { name: "Save booking" }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      title: "Updated flight booking",
      externalLinks: [expect.objectContaining({ id: booking.externalLinks[0].id })],
      ownerMemberId: booking.ownerMemberId,
      timezone: booking.timezone,
    }));

    await user.click(within(dialog).getByRole("button", { name: "Close booking dialog" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

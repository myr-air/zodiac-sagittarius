import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { seedTrip } from "@/src/trip/seed";
import type { BookingDoc, Member, TripTask } from "@/src/trip/types";
import { BookingsDocsPage, type BookingDocInput } from "./BookingsDocsPage";

const tasks: TripTask[] = [
  { id: "task-passport-nam", title: "เพิ่มชื่อ passport ของ Explorer Friend", status: "open", visibility: "shared", kind: "booking", createdBy: "member-nam", assigneeId: "member-nam" },
  { id: "task-hotel-names", title: "ยืนยันรายชื่อผู้เข้าพักโรงแรม", status: "open", visibility: "shared", kind: "booking", createdBy: "member-beam", assigneeId: "member-beam" },
  { id: "task-peak-tram", title: "จอง Peak Tram", status: "done", visibility: "shared", kind: "booking", createdBy: "member-beam", assigneeId: "member-beam" },
];

describe("BookingsDocsPage", () => {
  it("renders booking summaries, folders, ticket cards, and selected booking inspector", () => {
    renderPage();

    expect(screen.getByRole("region", { name: "Bookings & Docs" })).toBeInTheDocument();
    expect(screen.getByText("HKD 8,660")).toBeInTheDocument();
    expect(screen.getByText("2 need action")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Transport/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Transport/i })).toHaveClass("min-h-[72px]");
    expect(screen.getByRole("button", { name: /Travel docs/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Thu, Jun 18" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Select Bangkok to Hong Kong flight/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Select Bangkok to Hong Kong flight/i }).closest(".booking-ticket-card")).toHaveClass("min-h-[156px]");
    expect(screen.getByRole("heading", { name: "Bangkok to Hong Kong flight" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Open Airline booking/i })).toHaveAttribute("href", "https://example.com/airline/booking/QR349-HK");
  });

  it("browses booking docs by friendly folders instead of table filters", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: /Stays/i }));
    expect(screen.getByRole("button", { name: /Select Tsim Sha Tsui hotel stay/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Select Bangkok to Hong Kong flight/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Travel docs/i }));
    expect(screen.getByRole("button", { name: /Select Explorer Friend passport/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Select Peak Tram tickets/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Tickets/i }));
    expect(screen.getByRole("button", { name: /Select Peak Tram tickets/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Select Tsim Sha Tsui hotel stay/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Needs action/i }));
    expect(screen.getByRole("button", { name: /Select Explorer Friend passport/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Select Tsim Sha Tsui hotel stay/i })).toBeInTheDocument();
  });

  it("locks sensitive records for viewers while leaving shared rows visible", () => {
    const viewer = seedTrip.members.find((member) => member.role === "viewer")!;
    renderPage({ currentMember: viewer });

    expect(screen.getByRole("button", { name: /Select Bangkok to Hong Kong flight/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Select Explorer Friend passport/i })).not.toBeInTheDocument();
    expect(screen.getAllByText("Locked sensitive record")).toHaveLength(2);
  });

  it("submits new booking docs and edits existing records", async () => {
    const user = userEvent.setup();
    const onCreateBookingDoc = vi.fn();
    const onUpdateBookingDoc = vi.fn();
    renderPage({ onCreateBookingDoc, onUpdateBookingDoc });

    await user.click(screen.getByRole("button", { name: "Add booking" }));
    let dialog = screen.getByRole("dialog", { name: "Add booking" });
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
    renderPage({ onDeleteBookingDoc });

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

function renderPage(overrides: Partial<{
  currentMember: Member;
  bookingDocs: BookingDoc[];
  onCreateBookingDoc: (input: BookingDocInput) => void;
  onUpdateBookingDoc: (bookingDocId: string, input: BookingDocInput) => void;
  onDeleteBookingDoc: (bookingDocId: string) => void;
}> = {}) {
  const currentMember = overrides.currentMember ?? seedTrip.members[0];

  return renderWithI18n(
    <BookingsDocsPage
      trip={seedTrip}
      tasks={tasks}
      currentMember={currentMember}
      bookingDocs={overrides.bookingDocs ?? seedTrip.bookingDocs ?? []}
      canEditBookings={currentMember.role === "owner" || currentMember.role === "organizer"}
      onCreateBookingDoc={overrides.onCreateBookingDoc ?? vi.fn()}
      onUpdateBookingDoc={overrides.onUpdateBookingDoc ?? vi.fn()}
      onDeleteBookingDoc={overrides.onDeleteBookingDoc ?? vi.fn()}
    />,
    { locale: "en" },
  );
}

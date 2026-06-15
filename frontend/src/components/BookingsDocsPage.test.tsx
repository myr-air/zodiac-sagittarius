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
  it("renders booking folders, a file list, and selected booking inspector", () => {
    renderPage();

    expect(screen.getByRole("region", { name: "Bookings & Docs" })).toHaveClass("bookings-docs-page", "bg-transparent");
    expect(document.querySelector(".booking-docs-header")).toHaveClass("border-b", "bg-(--color-surface)", "grid-cols-[minmax(0,1fr)_auto]", "max-[767px]:hidden");
    expect(screen.getByRole("heading", { name: "Bookings & Docs" })).toHaveClass("max-[767px]:text-[17px]");
    expect(screen.getByText("Hong Kong + Shenzhen Trip")).toHaveClass("max-[767px]:hidden");
    expect(screen.getByText("Demo Traveler")).toBeInTheDocument();
    expect(screen.getByText("Can edit bookings")).toBeInTheDocument();
    expect(document.querySelector(".booking-folder-rail")).toHaveClass("shadow-[0_1px_0_rgb(15_23_42_/_0.04)]");
    expect(document.querySelector(".bookings-file-panel")).toHaveClass("shadow-[0_1px_0_rgb(15_23_42_/_0.04)]");
    expect(document.querySelector(".booking-inspector")).toHaveClass("shadow-[0_1px_0_rgb(15_23_42_/_0.04)]");
    expect(document.querySelector(".bookings-docs-page")).toHaveClass("max-[767px]:h-[calc(100dvh-48px)]", "max-[767px]:min-h-[calc(100dvh-48px)]", "max-[767px]:overflow-hidden", "max-[767px]:px-0", "max-[767px]:gap-0");
    expect(document.querySelector(".bookings-mobile-add-button")).toHaveClass("hidden", "max-[767px]:fixed", "max-[767px]:right-[60px]");
    expect(document.querySelector(".booking-folder-rail")).toHaveClass("max-[767px]:grid-cols-7", "max-[767px]:rounded-none", "max-[767px]:shadow-none");
    expect(document.querySelector(".bookings-content")).toHaveClass("grid-cols-[192px_minmax(0,1fr)_300px]", "max-[767px]:h-full", "max-[767px]:grid-rows-[auto_minmax(0,1fr)]");
    expect(document.querySelector(".bookings-file-panel")).toHaveClass("max-[1199px]:min-h-[520px]", "max-[767px]:grid-rows-[auto_auto_minmax(0,1fr)]", "max-[767px]:rounded-none", "max-[767px]:border-0", "max-[767px]:shadow-none");
    expect(document.querySelector(".bookings-file-toolbar")).toHaveClass("max-[767px]:p-0", "max-[767px]:gap-0");
    expect(document.querySelector(".bookings-file-panel > div:nth-child(2)")).toHaveClass("max-[767px]:px-0");
    expect(document.querySelector(".booking-file-list > div:first-child")).toHaveClass("sticky", "top-0", "min-w-[760px]");
    expect(document.querySelector(".booking-inspector")).toHaveClass("max-[767px]:!fixed", "max-[767px]:pb-[calc(12px+env(safe-area-inset-bottom))]", "max-[767px]:translate-y-full");
    expect(screen.getByText("Everything saved for this trip · 5 visible items")).toHaveClass("max-[767px]:hidden");
    expect(screen.getByPlaceholderText("Search bookings, docs, links")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Transport/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Transport/i })).toHaveClass("max-[767px]:grid-cols-1", "max-[767px]:border-b-2");
    expect(screen.getByRole("button", { name: /Links & files/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Travel docs/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Select Bangkok to Hong Kong flight/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Select Bangkok to Hong Kong flight/i }).closest(".booking-file-row")).toHaveClass("grid", "min-w-[760px]");
    expect(screen.getByRole("heading", { name: "Bangkok to Hong Kong flight" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Open Airline booking/i })[0]).toHaveAttribute("href", "https://example.com/airline/booking/QR349-HK");
  });

  it("opens the mobile preview as a bottom drawer from the file list", async () => {
    const user = userEvent.setup();
    renderPage();

    const inspector = document.querySelector(".booking-inspector");
    expect(inspector).toHaveClass("max-[767px]:translate-y-full");

    await user.click(screen.getByRole("button", { name: /Select Peak Tram tickets/i }));
    expect(inspector).toHaveClass("max-[767px]:translate-y-0", "max-[767px]:opacity-100");

    await user.click(screen.getByRole("button", { name: "Close booking preview" }));
    expect(inspector).toHaveClass("max-[767px]:translate-y-full", "max-[767px]:opacity-0");
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

  it("filters the file list by search text, status, and external-link folder", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByPlaceholderText("Search bookings, docs, links"), "Joii");
    expect(screen.getByRole("button", { name: /Select Tsim Sha Tsui hotel stay/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Select Bangkok to Hong Kong flight/i })).not.toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText("Search bookings, docs, links"));
    await user.selectOptions(screen.getByRole("combobox", { name: "Status" }), "confirmed");
    expect(screen.getByRole("button", { name: /Select Bangkok to Hong Kong flight/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Select Explorer Friend passport/i })).not.toBeInTheDocument();

    await user.selectOptions(screen.getByRole("combobox", { name: "Status" }), "all");
    await user.click(screen.getByRole("button", { name: /Links & files/i }));
    expect(screen.getByRole("button", { name: /Select Bangkok to Hong Kong flight/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Select Peak Tram tickets/i })).toBeInTheDocument();
  });

  it("submits new booking docs and edits existing records", async () => {
    const user = userEvent.setup();
    const onCreateBookingDoc = vi.fn();
    const onUpdateBookingDoc = vi.fn();
    renderPage({ onCreateBookingDoc, onUpdateBookingDoc });

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

import { vi } from "vitest";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { seedTrip } from "@/src/trip/seed";
import type { BookingDoc, Member } from "@/src/trip/types";
import { BookingsDocsPage, type BookingDocInput } from "./BookingsDocsPage";
import { bookingDocTestTasks } from "./bookings-docs-test-fixtures";

interface RenderBookingsDocsPageOptions {
  bookingDocs: BookingDoc[];
  currentMember: Member;
  onCreateBookingDoc: (input: BookingDocInput) => void;
  onDeleteBookingDoc: (bookingDocId: string) => void;
  onUpdateBookingDoc: (
    bookingDocId: string,
    input: BookingDocInput,
  ) => void;
}

export function renderBookingsDocsPage(
  overrides: Partial<RenderBookingsDocsPageOptions> = {},
) {
  const currentMember = overrides.currentMember ?? seedTrip.members[0];

  return renderWithI18n(
    <BookingsDocsPage
      trip={seedTrip}
      tasks={bookingDocTestTasks}
      currentMember={currentMember}
      bookingDocs={overrides.bookingDocs ?? seedTrip.bookingDocs ?? []}
      canEditBookings={
        currentMember.role === "owner" || currentMember.role === "organizer"
      }
      onCreateBookingDoc={overrides.onCreateBookingDoc ?? vi.fn()}
      onUpdateBookingDoc={overrides.onUpdateBookingDoc ?? vi.fn()}
      onDeleteBookingDoc={overrides.onDeleteBookingDoc ?? vi.fn()}
    />,
    { locale: "en" },
  );
}

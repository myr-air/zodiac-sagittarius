import { vi } from "vitest";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { seedTrip } from "@/src/trip/seed";
import {
  BookingsDocsPage,
  type BookingsDocsPageProps,
  type UpdateBookingDocHandler,
} from "../../BookingsDocsPage";
import { bookingDocTestTasks } from "../fixtures/bookings-docs-test-fixtures";

type RenderBookingsDocsPageOptions = Partial<BookingsDocsPageProps>;

export function renderBookingsDocsPage(
  overrides: Partial<RenderBookingsDocsPageOptions> = {},
) {
  const currentMember = overrides.currentMember ?? seedTrip.members[0];
  const onUpdateBookingDoc =
    overrides.onUpdateBookingDoc ?? (vi.fn() as UpdateBookingDocHandler);

  return renderWithI18n(
    <BookingsDocsPage
      trip={overrides.trip ?? seedTrip}
      tasks={overrides.tasks ?? bookingDocTestTasks}
      currentMember={currentMember}
      bookingDocs={overrides.bookingDocs ?? seedTrip.bookingDocs ?? []}
      canEditBookings={
        currentMember.role === "owner" || currentMember.role === "organizer"
      }
      onCreateBookingDoc={overrides.onCreateBookingDoc ?? vi.fn()}
      onUpdateBookingDoc={onUpdateBookingDoc}
      onDeleteBookingDoc={overrides.onDeleteBookingDoc ?? vi.fn()}
    />,
    { locale: "en" },
  );
}

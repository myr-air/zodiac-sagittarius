import type { BookingDoc, Expense, TripPhotoAlbumLink } from "../types";
import { createSeedBookingDocs } from "./seed-booking-docs";
import { createSeedExpenses } from "./seed-expenses";
import { createSeedPhotoAlbumLinks } from "./seed-photo-albums";

export function createSeedRecords({
  tripId,
  updatedAt,
}: {
  tripId: string;
  updatedAt: string;
}): {
  expenses: Expense[];
  bookingDocs: BookingDoc[];
  photoAlbumLinks: TripPhotoAlbumLink[];
} {
  return {
    expenses: createSeedExpenses(),
    bookingDocs: createSeedBookingDocs({ tripId, updatedAt }),
    photoAlbumLinks: createSeedPhotoAlbumLinks({ tripId, updatedAt }),
  };
}

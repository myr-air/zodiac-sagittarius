import { seedTrip } from "@/src/trip/seed";
import type { BookingDoc, TripTask } from "@/src/trip/types";

export const bookingDocTestDocs = seedTrip.bookingDocs ?? [];

export function bookingDocTestDocById(id: string): BookingDoc {
  const bookingDoc = bookingDocTestDocs.find((doc) => doc.id === id);
  if (!bookingDoc) {
    throw new Error(`Missing booking doc test fixture: ${id}`);
  }
  return bookingDoc;
}

export const bookingFlightTestDoc = bookingDocTestDocById(
  "booking-flight-bkk-hkg",
);
export const bookingPassportTestDoc = bookingDocTestDocById(
  "booking-passport-nam",
);

export const bookingDocTestTasks: TripTask[] = [
  {
    id: "task-passport-nam",
    title: "เพิ่มชื่อ passport ของ Explorer Friend",
    status: "open",
    visibility: "shared",
    kind: "booking",
    createdBy: "member-nam",
    assigneeId: "member-nam",
  },
  {
    id: "task-hotel-names",
    title: "ยืนยันรายชื่อผู้เข้าพักโรงแรม",
    status: "open",
    visibility: "shared",
    kind: "booking",
    createdBy: "member-beam",
    assigneeId: "member-beam",
  },
  {
    id: "task-peak-tram",
    title: "จอง Peak Tram",
    status: "done",
    visibility: "shared",
    kind: "booking",
    createdBy: "member-beam",
    assigneeId: "member-beam",
  },
];

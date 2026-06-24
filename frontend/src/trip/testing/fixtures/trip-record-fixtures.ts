import { seedTrip } from "../../seed";
import type { StopNote, Suggestion, TripTask } from "../../types";

export const tripFixtureSuggestions: Suggestion[] = [
  {
    id: "suggestion-rating",
    tripId: seedTrip.id,
    proposerId: "member-beam",
    type: "edit",
    targetItemId: "item-dimdim",
    planVariantId: seedTrip.activePlanVariantId,
    proposedPatch: { note: "ร้านนี้ได้รับคะแนนสูง 4.3/5 จาก 8,332 รีวิว" },
    sourceVersion: 4,
    status: "pending",
    createdAt: "2026-05-27T13:00:00.000Z",
  },
  {
    id: "suggestion-booking",
    tripId: seedTrip.id,
    proposerId: "member-beam",
    type: "edit",
    targetItemId: "item-dimdim",
    planVariantId: seedTrip.activePlanVariantId,
    proposedPatch: { note: "แนะนำให้จองคิวล่วงหน้า โดยเฉพาะช่วงสุดสัปดาห์" },
    sourceVersion: 2,
    status: "conflicted",
    createdAt: "2026-05-27T14:00:00.000Z",
  },
];

export function buildTripFixtureSuggestion(
  overrides: Partial<Suggestion> & Pick<Suggestion, "id">,
): Suggestion {
  return {
    tripId: seedTrip.id,
    proposerId: "member-beam",
    type: "edit",
    targetItemId: "item-dimdim",
    planVariantId: seedTrip.activePlanVariantId,
    proposedPatch: { activity: "Dim Dim Sum" },
    sourceVersion: 1,
    status: "pending",
    createdAt: "2026-06-18T00:00:00.000Z",
    ...overrides,
  };
}

export const tripFixtureTasks: TripTask[] = [
  { id: "task-esim", title: "ซื้อ eSIM", status: "open", visibility: "private", kind: "prep", createdBy: "member-aom", assigneeId: "member-aom" },
  { id: "task-passport-nam", title: "เพิ่มชื่อ passport ของ Explorer Friend", status: "open", visibility: "shared", kind: "booking", createdBy: "member-nam", assigneeId: "member-nam", relatedItemId: "item-flight-bkk-hkg" },
  { id: "task-hotel-names", title: "ยืนยันรายชื่อผู้เข้าพักโรงแรม", status: "open", visibility: "shared", kind: "booking", createdBy: "member-beam", assigneeId: "member-beam", relatedItemId: "item-hotel-checkin" },
  { id: "task-peak-tram", title: "จอง Peak Tram", status: "done", visibility: "shared", kind: "booking", createdBy: "member-beam", assigneeId: "member-beam", relatedItemId: "item-victoria-peak" },
  { id: "task-dimdim-booking", title: "ยืนยันคิว Dim Dim Sum", status: "open", visibility: "shared", kind: "booking", createdBy: "member-beam", assigneeId: "member-beam", relatedItemId: "item-dimdim" },
  { id: "task-expenses", title: "สรุปค่าใช้จ่ายวันแรก", status: "open", visibility: "shared", kind: "prep", createdBy: "member-beam", assigneeId: "member-beam" },
];

export function buildTripFixtureTask(
  overrides: Partial<TripTask> & Pick<TripTask, "id">,
): TripTask {
  return {
    title: "Task",
    status: "open",
    visibility: "shared",
    kind: "prep",
    createdBy: "member-aom",
    ...overrides,
  };
}

export const tripFixtureStopNotes: StopNote[] = [
  {
    id: "note-dimdim-1",
    tripId: seedTrip.id,
    itemId: "item-dimdim",
    authorId: "member-beam",
    body: "ลองไปเช้าหน่อย ถ้าคิวยาวให้สลับกับ coffee break",
    createdAt: "2026-05-27T12:30:00.000Z",
  },
];

export function buildTripFixtureStopNote(
  overrides: Partial<StopNote> & Pick<StopNote, "id">,
): StopNote {
  return {
    tripId: seedTrip.id,
    tripPlanId: seedTrip.activePlanVariantId,
    itemId: "item-dimdim",
    authorId: "member-aom",
    body: "Original note",
    createdAt: "2026-06-18T09:00:00.000Z",
    ...overrides,
  };
}

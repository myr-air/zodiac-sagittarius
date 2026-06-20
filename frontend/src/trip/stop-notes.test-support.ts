import type { StopNote } from "./types";

export function stopNote(input: Partial<StopNote> & Pick<StopNote, "id">): StopNote {
  return {
    tripId: "trip-1",
    tripPlanId: "plan-main",
    itemId: "item-peak",
    authorId: "member-aom",
    body: "Original note",
    createdAt: "2026-06-18T09:00:00.000Z",
    ...input,
  };
}

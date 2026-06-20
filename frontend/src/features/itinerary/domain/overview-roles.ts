import type { ItineraryItem, Member, TripTask } from "@/src/trip/types";

export type OverviewRoleLens = "manager" | "traveler" | "viewer";

export function overviewRoleLens(member?: Member): OverviewRoleLens {
  if (member?.role === "owner" || member?.role === "organizer") return "manager";
  if (member?.role === "traveler") return "traveler";
  return "viewer";
}

export function stopLabel(
  itemId: string,
  items: ItineraryItem[],
  fallback: string,
): string {
  /* v8 ignore next */
  return items.find((item) => item.id === itemId)?.activity ?? fallback;
}

export function travelerNextStopDetail(item: ItineraryItem, fallback: string): string {
  /* v8 ignore next */
  return item.transportation || item.note || fallback;
}

export function viewerNextStopDetail(item: ItineraryItem, fallback: string): string {
  /* v8 ignore next */
  return item.transportation || fallback;
}

export function managerNextStopDetail(item: ItineraryItem, fallback: string): string {
  /* v8 ignore next */
  return item.transportation || fallback;
}

export function taskKindLabel(
  task: TripTask,
  labels: { booking: string; prep: string },
): string {
  if (task.kind === "booking" || task.relatedItemId || task.title.includes("จอง")) {
    return labels.booking;
  }
  return labels.prep;
}

export function isMyTask(task: TripTask, currentMemberId: string): boolean {
  return task.createdBy === currentMemberId || task.assigneeId === currentMemberId;
}

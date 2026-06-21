import type { LocalStopNoteCreateInput } from "@/src/trip/records";
import {
  buildTaskCreateDraft,
  type TaskCreateDraft,
  type TaskCreateInputLike,
} from "@/src/trip/records";
import type { Trip } from "@/src/trip/types";
import { tripPlanIdForRecord } from "@/src/trip/workspace/trip-plan-records";

interface WorkspaceRecordCommandContext {
  currentMemberId: string;
  selectedTripPlanId: string;
  trip: Trip;
}

export function buildWorkspaceStopNoteCreateInput(
  input: { itemId: string; body: string },
  {
    selectedTripPlanId,
    trip,
  }: Pick<WorkspaceRecordCommandContext, "selectedTripPlanId" | "trip">,
): LocalStopNoteCreateInput | null {
  const body = input.body.trim();
  if (!body) return null;

  return {
    itemId: input.itemId,
    tripPlanId: tripPlanIdForRecord(trip, input.itemId, selectedTripPlanId),
    body,
  };
}

export function buildWorkspaceTaskCreateDraft(
  input: TaskCreateInputLike,
  {
    currentMemberId,
    selectedTripPlanId,
    trip,
  }: WorkspaceRecordCommandContext,
): TaskCreateDraft | null {
  const title = input.title.trim();
  if (!title) return null;

  return buildTaskCreateDraft(input, {
    title,
    tripPlanId: tripPlanIdForRecord(
      trip,
      input.relatedItemId ?? null,
      selectedTripPlanId,
    ),
    currentMemberId,
  });
}

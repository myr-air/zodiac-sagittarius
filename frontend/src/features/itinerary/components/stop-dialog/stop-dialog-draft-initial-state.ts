import type { ItineraryItem } from "@/src/trip/types";
import {
  buildInitialStopDetailValues,
  buildInitialStopFormValues,
} from "@/src/features/itinerary/domain/stop-form-model";
import { detailTypeFromItem } from "@/src/features/itinerary/domain/stop-details";
import type { StopDialogDraftState } from "./stop-dialog-draft.types";

interface BuildInitialStopDialogDraftStateInput {
  initialDay?: string;
  initialItem?: ItineraryItem;
  initialParentItemId?: string | null;
  startDate?: string;
}

export function buildInitialStopDialogDraftState({
  initialDay,
  initialItem,
  initialParentItemId,
  startDate,
}: BuildInitialStopDialogDraftStateInput): StopDialogDraftState {
  return {
    detailType: detailTypeFromItem(initialItem),
    detailValues: buildInitialStopDetailValues(initialItem),
    values: buildInitialStopFormValues({
      initialDay,
      initialItem,
      initialParentItemId,
      startDate,
    }),
  };
}

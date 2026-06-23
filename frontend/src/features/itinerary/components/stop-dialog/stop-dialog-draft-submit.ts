import { buildStopSubmitValues } from "@/src/features/itinerary/domain/stop-form-model";
import type { StopFormValues } from "@/src/features/itinerary/domain/stop-form-values";
import type { StopDialogDraftState } from "./stop-dialog-draft.types";

export function buildStopDialogDraftSubmitValues(
  state: StopDialogDraftState,
  saveUnresolved: boolean,
): StopFormValues {
  return buildStopSubmitValues({
    detailType: state.detailType,
    detailValues: state.detailValues,
    saveUnresolved,
    selectedCandidate: state.selectedCandidate,
    values: state.values,
  });
}

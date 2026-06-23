import type { PlaceResolutionCandidate } from "@/src/trip/types";
import type { StopFormValues } from "@/src/features/itinerary/domain/stop-form-values";
import type {
  StopDetailType,
  StopDetailValues,
} from "@/src/features/itinerary/domain/stop-details";

export interface StopDialogDraftState {
  detailType: StopDetailType;
  detailValues: StopDetailValues;
  selectedCandidate?: PlaceResolutionCandidate;
  values: StopFormValues;
}

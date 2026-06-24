import { type Dispatch, type FormEvent, type SetStateAction } from "react";
import type { Messages } from "@/src/i18n/messages";
import type { PlanVariant } from "@/src/trip/types";
import {
  clearTripPlanDraftError,
  closeTripPlanCreateMode,
  failTripPlanDraft,
  markTripPlanRenamed,
  type TripPlanControlDraftState,
} from "./trip-plan-controls-draft-state";
import type { TripPlanMutationResult } from "./trip-plan-controls.types";

interface UseTripPlanControlsActionsInput {
  canManageTripPlans: boolean;
  draftState: TripPlanControlDraftState;
  editedTripPlanName: string;
  emptyNameMessage: Messages["itinerary"]["tripPlans"]["emptyName"];
  isTripPlanBusy: boolean;
  onCreateTripPlan: (name: string) => TripPlanMutationResult;
  onRenameTripPlan: (
    tripPlanId: string,
    name: string,
  ) => TripPlanMutationResult;
  selectedTripPlan: PlanVariant | null | undefined;
  setDraftState: Dispatch<SetStateAction<TripPlanControlDraftState>>;
}

export function useTripPlanControlsActions({
  canManageTripPlans,
  draftState,
  editedTripPlanName,
  emptyNameMessage,
  isTripPlanBusy,
  onCreateTripPlan,
  onRenameTripPlan,
  selectedTripPlan,
  setDraftState,
}: UseTripPlanControlsActionsInput) {
  async function submitNewTripPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isTripPlanBusy || !canManageTripPlans) return;
    const name = draftState.newName.trim();
    if (!name) {
      setDraftState((current) => failTripPlanDraft(current, emptyNameMessage));
      return;
    }
    setDraftState((current) => clearTripPlanDraftError(current));
    const created = await onCreateTripPlan(name);
    if (created === false) return;
    setDraftState((current) => closeTripPlanCreateMode(current));
  }

  async function submitRenameTripPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isTripPlanBusy || !canManageTripPlans || !selectedTripPlan) return;
    const name = editedTripPlanName.trim();
    if (!name) {
      setDraftState((current) => failTripPlanDraft(current, emptyNameMessage));
      return;
    }
    if (name === selectedTripPlan.name) return;
    setDraftState((current) => clearTripPlanDraftError(current));
    const renamed = await onRenameTripPlan(selectedTripPlan.id, name);
    if (renamed === false) return;
    setDraftState((current) =>
      markTripPlanRenamed(current, selectedTripPlan.id, name),
    );
  }

  return {
    submitNewTripPlan,
    submitRenameTripPlan,
  };
}

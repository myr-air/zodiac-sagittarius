import { useState, type SetStateAction } from "react";
import type { PlanVariant } from "@/src/trip/types";
import type { Messages } from "@/src/i18n/messages";
import { findTripPlanOptionById, tripPlanStatus } from "@/src/trip/trip-plans";
import {
  changeTripPlanEditedNameDraft,
  changeTripPlanNewNameDraft,
  closeTripPlanCreateMode,
  initialTripPlanControlDraftState,
  resetTripPlanSelectionDraft,
  resolveEditedTripPlanName,
  setTripPlanCreateMode,
} from "./trip-plan-controls-draft-state";
import { useTripPlanControlsActions } from "./use-trip-plan-controls-actions";
import type { TripPlanMutationResult } from "./trip-plan-controls.types";

interface TripPlanControlsStateInput {
  canManageTripPlans: boolean;
  emptyNameMessage: Messages["itinerary"]["tripPlans"]["emptyName"];
  isTripPlanBusy: boolean;
  mainTripPlanId: string;
  onChangeTripPlan: (tripPlanId: string) => void;
  onCreateTripPlan: (name: string) => TripPlanMutationResult;
  onRenameTripPlan: (
    tripPlanId: string,
    name: string,
  ) => TripPlanMutationResult;
  selectedTripPlanId: string;
  tripPlans: PlanVariant[];
}

export function useTripPlanControlsState({
  canManageTripPlans,
  emptyNameMessage,
  isTripPlanBusy,
  mainTripPlanId,
  onChangeTripPlan,
  onCreateTripPlan,
  onRenameTripPlan,
  selectedTripPlanId,
  tripPlans,
}: TripPlanControlsStateInput) {
  const [draftState, setDraftState] = useState(
    initialTripPlanControlDraftState,
  );

  const selectedTripPlan = findTripPlanOptionById(
    tripPlans,
    selectedTripPlanId,
  );
  const selectedTripPlanStatus = selectedTripPlan
    ? tripPlanStatus(selectedTripPlan)
    : "draft";
  const editedTripPlanName = resolveEditedTripPlanName(
    draftState,
    selectedTripPlan,
  );
  const selectedTripPlanIsMain =
    Boolean(selectedTripPlanId) && selectedTripPlanId === mainTripPlanId;

  const tripPlanSelectorDisabled = isTripPlanBusy || tripPlans.length === 0;
  const tripPlanControlsDisabled =
    !canManageTripPlans || tripPlanSelectorDisabled;
  const tripPlanStatusDisabled =
    tripPlanControlsDisabled || !selectedTripPlan || selectedTripPlanIsMain;
  const setMainTripPlanDisabled =
    tripPlanControlsDisabled || !selectedTripPlan || selectedTripPlanIsMain;
  const renameTripPlanDisabled =
    tripPlanControlsDisabled ||
    !selectedTripPlan ||
    !editedTripPlanName.trim() ||
    editedTripPlanName.trim() === selectedTripPlan.name;

  function closeCreateMode() {
    setDraftState((current) => closeTripPlanCreateMode(current));
  }

  function changeTripPlan(nextTripPlanId: string) {
    setDraftState((current) => resetTripPlanSelectionDraft(current));
    onChangeTripPlan(nextTripPlanId);
  }

  function changeEditedTripPlanName(nextName: string) {
    if (!selectedTripPlan) return;
    setDraftState((current) =>
      changeTripPlanEditedNameDraft(current, selectedTripPlan.id, nextName),
    );
  }

  function changeNewTripPlanName(nextName: string) {
    setDraftState((current) => changeTripPlanNewNameDraft(current, nextName));
  }

  function setIsCreatingTripPlan(nextIsCreating: SetStateAction<boolean>) {
    setDraftState((current) =>
      setTripPlanCreateMode(
        current,
        typeof nextIsCreating === "function"
          ? nextIsCreating(current.isCreating)
          : nextIsCreating,
      ),
    );
  }

  const { submitNewTripPlan, submitRenameTripPlan } =
    useTripPlanControlsActions({
      canManageTripPlans,
      draftState,
      editedTripPlanName,
      emptyNameMessage,
      isTripPlanBusy,
      onCreateTripPlan,
      onRenameTripPlan,
      selectedTripPlan,
      setDraftState,
    });

  return {
    changeEditedTripPlanName,
    changeNewTripPlanName,
    changeTripPlan,
    closeCreateMode,
    editedTripPlanName,
    isCreatingTripPlan: draftState.isCreating,
    newTripPlanError: draftState.createError,
    newTripPlanName: draftState.newName,
    renameTripPlanDisabled,
    selectedTripPlan,
    selectedTripPlanIsMain,
    selectedTripPlanStatus,
    setIsCreatingTripPlan,
    setMainTripPlanDisabled,
    submitNewTripPlan,
    submitRenameTripPlan,
    tripPlanControlsDisabled,
    tripPlanSelectorDisabled,
    tripPlanStatusDisabled,
  };
}

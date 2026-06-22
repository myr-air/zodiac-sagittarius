import { useState, type FormEvent, type SetStateAction } from "react";
import type { PlanVariant } from "@/src/trip/types";
import type { Messages } from "@/src/i18n/messages";
import { findTripPlanOptionById } from "@/src/trip/trip-plans";
import { tripPlanStatus } from "./smart-itinerary-table-trip-plan-labels";
import {
  changeTripPlanEditedNameDraft,
  changeTripPlanNewNameDraft,
  clearTripPlanDraftError,
  closeTripPlanCreateMode,
  failTripPlanDraft,
  initialTripPlanControlDraftState,
  markTripPlanRenamed,
  resetTripPlanSelectionDraft,
  resolveEditedTripPlanName,
  setTripPlanCreateMode,
} from "./trip-plan-controls-draft-state";
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
    closeCreateMode();
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

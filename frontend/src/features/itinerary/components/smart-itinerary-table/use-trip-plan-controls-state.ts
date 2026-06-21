import { useState, type FormEvent } from "react";
import type { PlanVariant } from "@/src/trip/types";
import type { Messages } from "@/src/i18n/messages";
import { tripPlanStatus } from "./smart-itinerary-table-utils";
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
  const [isCreatingTripPlan, setIsCreatingTripPlan] = useState(false);
  const [newTripPlanName, setNewTripPlanName] = useState("");
  const [editedTripPlanNameDraft, setEditedTripPlanNameDraft] = useState<{
    name: string;
    planId: string;
  } | null>(null);
  const [newTripPlanError, setNewTripPlanError] = useState<string | null>(null);

  const selectedTripPlan =
    tripPlans.find((plan) => plan.id === selectedTripPlanId) ?? null;
  const selectedTripPlanStatus = selectedTripPlan
    ? tripPlanStatus(selectedTripPlan)
    : "draft";
  const editedTripPlanName =
    editedTripPlanNameDraft &&
    selectedTripPlan &&
    editedTripPlanNameDraft.planId === selectedTripPlan.id
      ? editedTripPlanNameDraft.name
      : (selectedTripPlan?.name ?? "");
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
    setIsCreatingTripPlan(false);
    setNewTripPlanName("");
    setNewTripPlanError(null);
  }

  function changeTripPlan(nextTripPlanId: string) {
    setNewTripPlanError(null);
    setEditedTripPlanNameDraft(null);
    onChangeTripPlan(nextTripPlanId);
  }

  function changeEditedTripPlanName(nextName: string) {
    if (!selectedTripPlan) return;
    setEditedTripPlanNameDraft({
      name: nextName,
      planId: selectedTripPlan.id,
    });
    setNewTripPlanError(null);
  }

  function changeNewTripPlanName(nextName: string) {
    setNewTripPlanName(nextName);
    setNewTripPlanError(null);
  }

  async function submitNewTripPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isTripPlanBusy || !canManageTripPlans) return;
    const name = newTripPlanName.trim();
    if (!name) {
      setNewTripPlanError(emptyNameMessage);
      return;
    }
    setNewTripPlanError(null);
    const created = await onCreateTripPlan(name);
    if (created === false) return;
    closeCreateMode();
  }

  async function submitRenameTripPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isTripPlanBusy || !canManageTripPlans || !selectedTripPlan) return;
    const name = editedTripPlanName.trim();
    if (!name) {
      setNewTripPlanError(emptyNameMessage);
      return;
    }
    if (name === selectedTripPlan.name) return;
    setNewTripPlanError(null);
    const renamed = await onRenameTripPlan(selectedTripPlan.id, name);
    if (renamed === false) return;
    setEditedTripPlanNameDraft({ name, planId: selectedTripPlan.id });
  }

  return {
    changeEditedTripPlanName,
    changeNewTripPlanName,
    changeTripPlan,
    closeCreateMode,
    editedTripPlanName,
    isCreatingTripPlan,
    newTripPlanError,
    newTripPlanName,
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

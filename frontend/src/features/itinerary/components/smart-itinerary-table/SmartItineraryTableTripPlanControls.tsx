import { useState, type FormEvent } from "react";
import type { PlanStatus, PlanVariant } from "@/src/trip/types";
import type { Messages } from "@/src/i18n/messages";
import { Button, Select } from "@/src/ui";
import {
  headerControlsSectionClassName,
  tripPlanActionsClassName,
  tripPlanButtonClassName,
  tripPlanCreateFormClassName,
  tripPlanFieldClassName,
  tripPlanNameFieldClassName,
  tripPlanNameInputClassName,
  tripPlanSecondaryButtonClassName,
  tripPlanSelectClassName,
} from "../smart-itinerary-table.styles";
import { formatTripPlanOptionLabel, tripPlanStatus } from "../smart-itinerary-table-utils";

type SubmitTripPlanResult = boolean | void | Promise<boolean | void>;

type RenameTripPlanResult = boolean | void | Promise<boolean | void>;

interface SmartItineraryTableTripPlanControlsProps {
  canManageTripPlans: boolean;
  itineraryLabels: Messages["itinerary"];
  isTripPlanBusy: boolean;
  mainTripPlanId: string;
  onChangeTripPlan: (tripPlanId: string) => void;
  onChangeTripPlanStatus: (
    tripPlanId: string,
    status: Exclude<PlanStatus, "main">,
  ) => SubmitTripPlanResult;
  onCreateTripPlan: (name: string) => SubmitTripPlanResult;
  onRenameTripPlan: (
    tripPlanId: string,
    name: string,
  ) => RenameTripPlanResult;
  onSetMainTripPlan: (tripPlanId: string) => SubmitTripPlanResult;
  selectedTripPlanId: string;
  tripPlans: PlanVariant[];
}

export function SmartItineraryTableTripPlanControls({
  canManageTripPlans,
  itineraryLabels,
  isTripPlanBusy,
  mainTripPlanId,
  onChangeTripPlan,
  onChangeTripPlanStatus,
  onCreateTripPlan,
  onRenameTripPlan,
  onSetMainTripPlan,
  selectedTripPlanId,
  tripPlans,
}: SmartItineraryTableTripPlanControlsProps) {
  const [isCreatingTripPlan, setIsCreatingTripPlan] = useState(false);
  const [newTripPlanName, setNewTripPlanName] = useState("");
  const [editedTripPlanNameDraft, setEditedTripPlanNameDraft] = useState<
    | {
        name: string;
        planId: string;
      }
    | null
  >(null);
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
  const tripPlanControlsDisabled = !canManageTripPlans || tripPlanSelectorDisabled;
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

  async function submitNewTripPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isTripPlanBusy || !canManageTripPlans) return;
    const name = newTripPlanName.trim();
    if (!name) {
      setNewTripPlanError(itineraryLabels.tripPlans.emptyName);
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
      setNewTripPlanError(itineraryLabels.tripPlans.emptyName);
      return;
    }
    if (name === selectedTripPlan.name) return;
    setNewTripPlanError(null);
    const renamed = await onRenameTripPlan(selectedTripPlan.id, name);
    if (renamed === false) return;
    setEditedTripPlanNameDraft({ name, planId: selectedTripPlan.id });
  }

  return (
    <div className={headerControlsSectionClassName}>
      <form className="grid min-w-0 gap-2" onSubmit={submitRenameTripPlan}>
        <label className={tripPlanFieldClassName}>
          <span>{itineraryLabels.tripPlans.selectorLabel}</span>
          <Select
            className={tripPlanSelectClassName}
            value={selectedTripPlanId}
            disabled={tripPlanSelectorDisabled}
            onChange={(event) => {
              setNewTripPlanError(null);
              setEditedTripPlanNameDraft(null);
              onChangeTripPlan(event.target.value);
            }}
          >
            {tripPlans.map((plan) => (
              <option value={plan.id} key={plan.id}>
                {formatTripPlanOptionLabel(plan, itineraryLabels.tripPlans.status)}
              </option>
            ))}
          </Select>
        </label>
        <label className={tripPlanFieldClassName}>
          <span>{itineraryLabels.tripPlans.statusLabel}</span>
          <Select
            className={tripPlanSelectClassName}
            value={selectedTripPlanStatus}
            disabled={tripPlanStatusDisabled}
            onChange={(event) =>
              onChangeTripPlanStatus(
                selectedTripPlanId,
                event.target.value as Exclude<PlanStatus, "main">,
              )
            }
          >
            <option value="main" disabled>
              {itineraryLabels.tripPlans.status.main}
            </option>
            <option value="draft">{itineraryLabels.tripPlans.status.draft}</option>
            <option value="backup">{itineraryLabels.tripPlans.status.backup}</option>
            <option value="proposal">{itineraryLabels.tripPlans.status.proposal}</option>
          </Select>
        </label>
        <label className={tripPlanFieldClassName}>
          <span>{itineraryLabels.tripPlans.nameLabel}</span>
          <input
            className={tripPlanNameInputClassName}
            value={editedTripPlanName}
            disabled={tripPlanControlsDisabled || !selectedTripPlan}
            onChange={(event) => {
              if (!selectedTripPlan) return;
              setEditedTripPlanNameDraft({
                name: event.target.value,
                planId: selectedTripPlan.id,
              });
              setNewTripPlanError(null);
            }}
          />
        </label>
        <Button
          type="submit"
          disabled={renameTripPlanDisabled}
          className={tripPlanButtonClassName}
        >
          {itineraryLabels.tripPlans.saveName}
        </Button>
      </form>
      {canManageTripPlans ? (
        <div className={tripPlanActionsClassName}>
          <Button
            type="button"
            disabled={setMainTripPlanDisabled}
            className={tripPlanButtonClassName}
            onClick={() => onSetMainTripPlan(selectedTripPlanId)}
          >
            {itineraryLabels.tripPlans.setMain}
          </Button>
          {isCreatingTripPlan ? (
            <form className={tripPlanCreateFormClassName} onSubmit={submitNewTripPlan}>
              <label className={tripPlanNameFieldClassName}>
                <span>{itineraryLabels.tripPlans.nameLabel}</span>
                <input
                  className={tripPlanNameInputClassName}
                  value={newTripPlanName}
                  disabled={isTripPlanBusy}
                  placeholder={itineraryLabels.tripPlans.namePlaceholder}
                  onChange={(event) => {
                    setNewTripPlanName(event.target.value);
                    setNewTripPlanError(null);
                  }}
                />
              </label>
              <Button
                type="submit"
                disabled={isTripPlanBusy}
                className={tripPlanButtonClassName}
              >
                {itineraryLabels.tripPlans.createConfirm}
              </Button>
              <button
                type="button"
                className={tripPlanSecondaryButtonClassName}
                disabled={isTripPlanBusy}
                onClick={closeCreateMode}
              >
                {itineraryLabels.tripPlans.createCancel}
              </button>
            </form>
          ) : (
            <Button
              type="button"
              disabled={isTripPlanBusy}
              className={tripPlanButtonClassName}
              onClick={() => setIsCreatingTripPlan(true)}
            >
              {itineraryLabels.tripPlans.create}
            </Button>
          )}
        </div>
      ) : null}
      {newTripPlanError ? <p>{newTripPlanError}</p> : null}
    </div>
  );
}

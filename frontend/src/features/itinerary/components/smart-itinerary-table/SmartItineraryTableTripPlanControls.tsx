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
} from "./smart-itinerary-table.styles";
import { formatTripPlanOptionLabel } from "./smart-itinerary-table-utils";
import { useTripPlanControlsState } from "./use-trip-plan-controls-state";

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
  const state = useTripPlanControlsState({
    canManageTripPlans,
    emptyNameMessage: itineraryLabels.tripPlans.emptyName,
    isTripPlanBusy,
    mainTripPlanId,
    onChangeTripPlan,
    onCreateTripPlan,
    onRenameTripPlan,
    selectedTripPlanId,
    tripPlans,
  });

  return (
    <div className={headerControlsSectionClassName}>
      <form className="grid min-w-0 gap-2" onSubmit={state.submitRenameTripPlan}>
        <label className={tripPlanFieldClassName}>
          <span>{itineraryLabels.tripPlans.selectorLabel}</span>
          <Select
            className={tripPlanSelectClassName}
            value={selectedTripPlanId}
            disabled={state.tripPlanSelectorDisabled}
            onChange={(event) => state.changeTripPlan(event.target.value)}
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
            value={state.selectedTripPlanStatus}
            disabled={state.tripPlanStatusDisabled}
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
            value={state.editedTripPlanName}
            disabled={state.tripPlanControlsDisabled || !state.selectedTripPlan}
            onChange={(event) => state.changeEditedTripPlanName(event.target.value)}
          />
        </label>
        <Button
          type="submit"
          disabled={state.renameTripPlanDisabled}
          className={tripPlanButtonClassName}
        >
          {itineraryLabels.tripPlans.saveName}
        </Button>
      </form>
      {canManageTripPlans ? (
        <div className={tripPlanActionsClassName}>
          <Button
            type="button"
            disabled={state.setMainTripPlanDisabled}
            className={tripPlanButtonClassName}
            onClick={() => onSetMainTripPlan(selectedTripPlanId)}
          >
            {itineraryLabels.tripPlans.setMain}
          </Button>
          {state.isCreatingTripPlan ? (
            <form className={tripPlanCreateFormClassName} onSubmit={state.submitNewTripPlan}>
              <label className={tripPlanNameFieldClassName}>
                <span>{itineraryLabels.tripPlans.nameLabel}</span>
                <input
                  className={tripPlanNameInputClassName}
                  value={state.newTripPlanName}
                  disabled={isTripPlanBusy}
                  placeholder={itineraryLabels.tripPlans.namePlaceholder}
                  onChange={(event) => state.changeNewTripPlanName(event.target.value)}
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
                onClick={state.closeCreateMode}
              >
                {itineraryLabels.tripPlans.createCancel}
              </button>
            </form>
          ) : (
            <Button
              type="button"
              disabled={isTripPlanBusy}
              className={tripPlanButtonClassName}
              onClick={() => state.setIsCreatingTripPlan(true)}
            >
              {itineraryLabels.tripPlans.create}
            </Button>
          )}
        </div>
      ) : null}
      {state.newTripPlanError ? <p>{state.newTripPlanError}</p> : null}
    </div>
  );
}

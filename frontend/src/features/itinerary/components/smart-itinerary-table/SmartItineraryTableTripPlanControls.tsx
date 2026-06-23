import { SelectOptions } from "@/src/shared/components/select-options";
import type { PlanStatus } from "@/src/trip/types";
import { Button, Select } from "@/src/ui";
import {
  headerControlsSectionClassName,
  tripPlanActionsClassName,
  tripPlanButtonClassName,
  tripPlanFieldClassName,
  tripPlanNameInputClassName,
  tripPlanSelectClassName,
} from "./smart-itinerary-table.styles";
import { SmartItineraryTableTripPlanCreateControls } from "./SmartItineraryTableTripPlanCreateControls";
import {
  buildSmartItineraryTripPlanSelectOptions,
  smartItineraryTripPlanStatusSelectOptions,
} from "./smart-itinerary-table-trip-plan-labels";
import type { SmartItineraryTableTripPlanControlsProps } from "./trip-plan-controls.types";
import { useTripPlanControlsState } from "./use-trip-plan-controls-state";

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
            <SelectOptions
              options={buildSmartItineraryTripPlanSelectOptions(
                tripPlans,
                itineraryLabels.tripPlans.status,
              )}
            />
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
            <SelectOptions
              options={smartItineraryTripPlanStatusSelectOptions(
                itineraryLabels.tripPlans.status,
              )}
            />
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
          <SmartItineraryTableTripPlanCreateControls
            isCreatingTripPlan={state.isCreatingTripPlan}
            isTripPlanBusy={isTripPlanBusy}
            labels={itineraryLabels.tripPlans}
            newTripPlanName={state.newTripPlanName}
            onCancel={state.closeCreateMode}
            onChangeName={state.changeNewTripPlanName}
            onOpen={() => state.setIsCreatingTripPlan(true)}
            onSubmit={state.submitNewTripPlan}
          />
        </div>
      ) : null}
      {state.newTripPlanError ? <p>{state.newTripPlanError}</p> : null}
    </div>
  );
}

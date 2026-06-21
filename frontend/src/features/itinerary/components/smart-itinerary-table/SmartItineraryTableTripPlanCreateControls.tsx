import type { FormEvent } from "react";
import type { Messages } from "@/src/i18n/messages";
import { Button } from "@/src/ui";
import {
  tripPlanButtonClassName,
  tripPlanCreateFormClassName,
  tripPlanNameFieldClassName,
  tripPlanNameInputClassName,
  tripPlanSecondaryButtonClassName,
} from "./smart-itinerary-table.styles";

interface SmartItineraryTableTripPlanCreateControlsProps {
  isCreatingTripPlan: boolean;
  isTripPlanBusy: boolean;
  labels: Messages["itinerary"]["tripPlans"];
  newTripPlanName: string;
  onCancel: () => void;
  onChangeName: (name: string) => void;
  onOpen: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function SmartItineraryTableTripPlanCreateControls({
  isCreatingTripPlan,
  isTripPlanBusy,
  labels,
  newTripPlanName,
  onCancel,
  onChangeName,
  onOpen,
  onSubmit,
}: SmartItineraryTableTripPlanCreateControlsProps) {
  if (!isCreatingTripPlan) {
    return (
      <Button
        type="button"
        disabled={isTripPlanBusy}
        className={tripPlanButtonClassName}
        onClick={onOpen}
      >
        {labels.create}
      </Button>
    );
  }

  return (
    <form className={tripPlanCreateFormClassName} onSubmit={onSubmit}>
      <label className={tripPlanNameFieldClassName}>
        <span>{labels.nameLabel}</span>
        <input
          className={tripPlanNameInputClassName}
          value={newTripPlanName}
          disabled={isTripPlanBusy}
          placeholder={labels.namePlaceholder}
          onChange={(event) => onChangeName(event.target.value)}
        />
      </label>
      <Button
        type="submit"
        disabled={isTripPlanBusy}
        className={tripPlanButtonClassName}
      >
        {labels.createConfirm}
      </Button>
      <button
        type="button"
        className={tripPlanSecondaryButtonClassName}
        disabled={isTripPlanBusy}
        onClick={onCancel}
      >
        {labels.createCancel}
      </button>
    </form>
  );
}

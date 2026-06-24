import type { FormEvent } from "react";
import type { Messages } from "@/src/i18n/messages";
import type { PlanStatus, PlanVariant } from "@/src/trip/types";

export type TripPlanMutationResult = boolean | void | Promise<boolean | void>;

export type TripPlanFilterOption = { id: string; name: string };

export interface TripPlanControlHandlers {
  onChangeTripPlan: (tripPlanId: string) => TripPlanMutationResult;
  onChangeTripPlanStatus: (
    tripPlanId: string,
    status: Exclude<PlanStatus, "main">,
  ) => TripPlanMutationResult;
  onCreateTripPlan: (name: string) => TripPlanMutationResult;
  onRenameTripPlan: (
    tripPlanId: string,
    name: string,
  ) => TripPlanMutationResult;
  onSetMainTripPlan: (tripPlanId: string) => TripPlanMutationResult;
}

export interface SmartItineraryTablePathFiltersProps {
  filterOptions: TripPlanFilterOption[];
  itineraryLabels: Messages["itinerary"];
  onChangeShowAllPaths?: (showAll: boolean) => void;
  onTogglePathFilter: (pathId: string) => void;
  selectedFilterLabel: string;
  selectedPathIds: Set<string>;
  showAllPaths: boolean;
}

export interface SmartItineraryTableTripPlanControlsProps
  extends TripPlanControlHandlers {
  canManageTripPlans: boolean;
  itineraryLabels: Messages["itinerary"];
  isTripPlanBusy: boolean;
  mainTripPlanId: string;
  selectedTripPlanId: string;
  tripPlans: PlanVariant[];
}

export interface SmartItineraryTableTripPlanCreateControlsProps {
  isCreatingTripPlan: boolean;
  isTripPlanBusy: boolean;
  labels: Messages["itinerary"]["tripPlans"];
  newTripPlanName: string;
  onCancel: () => void;
  onChangeName: (name: string) => void;
  onOpen: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export interface SmartItineraryTableHeaderControlsPanelProps
  extends SmartItineraryTablePathFiltersProps,
    SmartItineraryTableTripPlanControlsProps {
  selectedTripPlan: PlanVariant | null;
  tripPlanError: string | null;
}

export interface TripPlanHeaderControlsProps
  extends Omit<
    SmartItineraryTableHeaderControlsPanelProps,
    "selectedTripPlan"
  > {
  canEdit: boolean;
}

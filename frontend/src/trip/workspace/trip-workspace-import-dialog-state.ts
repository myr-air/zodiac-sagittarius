import { useState } from "react";
import { updateFieldState } from "@/src/shared/form-state";
import {
  mainItineraryPathName,
  type ItineraryImportApplyTarget,
  type ItineraryPathOption,
} from "@/src/trip/itinerary-paths";
import type { ItineraryExportItem } from "@/src/trip/itinerary-import-export";
import type { PlanVariant } from "@/src/trip/types";
import { buildItineraryImportApplyTarget } from "./itinerary-import-target";

export interface TripWorkspaceImportDialogState {
  day: string;
  mode: ItineraryImportApplyTarget["mode"];
  pathNameInput: string;
  recordMode: ItineraryImportApplyTarget["recordMode"];
  scope: ItineraryImportApplyTarget["scope"];
  targetTripPlanId: string;
}

export function initialTripWorkspaceImportDialogState({
  currentTripPathId,
  importedItems,
  pathOptions,
  startDate,
  tripPlanId,
}: {
  currentTripPathId: string;
  importedItems: ItineraryExportItem[];
  pathOptions: ItineraryPathOption[];
  startDate: string;
  tripPlanId: string;
}): TripWorkspaceImportDialogState {
  const currentPathName =
    pathOptions.find((option) => option.id === currentTripPathId)?.name ??
    mainItineraryPathName;

  return {
    day: importedItems[0]?.day ?? startDate,
    mode: "replace-target",
    pathNameInput: currentPathName,
    recordMode: "clone-linked",
    scope: "trip",
    targetTripPlanId: tripPlanId,
  };
}

export function buildTripWorkspaceImportApplyTarget({
  memberId,
  pathOptions,
  state,
}: {
  memberId: string;
  pathOptions: ItineraryPathOption[];
  state: TripWorkspaceImportDialogState;
}): ItineraryImportApplyTarget | null {
  const pathName = state.pathNameInput.trim() || mainItineraryPathName;
  const targetDay = state.scope === "day" ? state.day.trim() : undefined;
  if (state.scope === "day" && !targetDay) return null;
  return buildItineraryImportApplyTarget({
    day: targetDay,
    memberId,
    mode: state.mode,
    pathName,
    pathOptions,
    recordMode: state.recordMode,
    scope: state.scope,
    tripPlanId: state.targetTripPlanId,
  });
}

export function useTripWorkspaceImportDialogState({
  currentTripPathId,
  importedItems,
  pathOptions,
  startDate,
  tripPlanId,
}: {
  currentTripPathId: string;
  importedItems: ItineraryExportItem[];
  pathOptions: ItineraryPathOption[];
  startDate: string;
  tripPlanId: string;
}) {
  const [state, setState] = useState(() =>
    initialTripWorkspaceImportDialogState({
      currentTripPathId,
      importedItems,
      pathOptions,
      startDate,
      tripPlanId,
    }),
  );

  function updateField<Field extends keyof TripWorkspaceImportDialogState>(
    field: Field,
    value: TripWorkspaceImportDialogState[Field],
  ) {
    setState((current) => updateFieldState(current, field, value));
  }

  return {
    ...state,
    setDay: (day: string) => updateField("day", day),
    setMode: (mode: ItineraryImportApplyTarget["mode"]) =>
      updateField("mode", mode),
    setPathNameInput: (pathNameInput: string) =>
      updateField("pathNameInput", pathNameInput),
    setRecordMode: (recordMode: ItineraryImportApplyTarget["recordMode"]) =>
      updateField("recordMode", recordMode),
    setScope: (scope: ItineraryImportApplyTarget["scope"]) =>
      updateField("scope", scope),
    setTargetTripPlanId: (targetTripPlanId: PlanVariant["id"]) =>
      updateField("targetTripPlanId", targetTripPlanId),
  };
}

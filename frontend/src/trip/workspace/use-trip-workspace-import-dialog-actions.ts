import type { FormEvent } from "react";
import type {
  ItineraryImportApplyTarget,
  ItineraryPathOption,
} from "@/src/trip/itinerary-paths";
import { buildTripWorkspaceImportApplyTarget } from "./trip-workspace-import-dialog-state";
import type { TripWorkspaceImportDialogState } from "./trip-workspace-import-dialog-state";

interface UseTripWorkspaceImportDialogActionsOptions {
  memberId: string;
  onApply: (target: ItineraryImportApplyTarget) => void;
  pathOptions: ItineraryPathOption[];
  state: TripWorkspaceImportDialogState;
}

export function useTripWorkspaceImportDialogActions({
  memberId,
  onApply,
  pathOptions,
  state,
}: UseTripWorkspaceImportDialogActionsOptions) {
  function submitImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const target = buildTripWorkspaceImportApplyTarget({
      memberId,
      pathOptions,
      state,
    });
    if (!target) return;
    onApply(target);
  }

  return {
    submitImport,
  };
}

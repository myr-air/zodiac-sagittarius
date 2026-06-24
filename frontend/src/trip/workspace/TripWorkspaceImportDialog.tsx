import { WorkspaceCompactFormDialog } from "@/src/shared/components/workspace-dialog";
import { Button } from "@/src/ui";
import {
  type ItineraryPathOption,
  type ItineraryImportApplyTarget,
} from "@/src/trip/itinerary-paths";
import type {
  ItineraryExportItem,
  ItineraryExportRecords,
} from "@/src/trip/itinerary-import-export";
import type { PlanVariant } from "@/src/trip/types";
import { useTripWorkspaceImportDialogState } from "./trip-workspace-import-dialog-state";
import { useTripWorkspaceImportDialogActions } from "./use-trip-workspace-import-dialog-actions";
import {
  TripWorkspaceImportDialogFields,
  TripWorkspaceImportDialogSummary,
} from "./TripWorkspaceImportDialogFields";
import {
  importDialogClassName,
} from "./TripWorkspaceDialog.styles";

interface TripWorkspaceImportDialogProps {
  currentTripPathId: string;
  importedItems: ItineraryExportItem[];
  memberId: string;
  onApply: (target: ItineraryImportApplyTarget) => void;
  onClose: () => void;
  pathOptions: ItineraryPathOption[];
  records: ItineraryExportRecords;
  startDate: string;
  tripPlanId: string;
  tripPlanOptions: PlanVariant[];
}

export function TripWorkspaceImportDialog({
  importedItems,
  memberId,
  pathOptions,
  records,
  startDate,
  currentTripPathId,
  tripPlanOptions,
  tripPlanId,
  onApply,
  onClose,
}: TripWorkspaceImportDialogProps) {
  const recordCount =
    records.expenses.length +
    records.bookingDocs.length +
    records.stopNotes.length +
    records.tasks.length;
  const importDialogState = useTripWorkspaceImportDialogState({
    currentTripPathId,
    importedItems,
    pathOptions,
    startDate,
    tripPlanId,
  });
  const {
    day,
    mode,
    pathNameInput,
    recordMode,
    scope,
    setDay,
    setMode,
    setPathNameInput,
    setRecordMode,
    setScope,
    setTargetTripPlanId,
    targetTripPlanId,
  } = importDialogState;
  const { submitImport } = useTripWorkspaceImportDialogActions({
    memberId,
    onApply,
    pathOptions,
    state: importDialogState,
  });

  return (
    <WorkspaceCompactFormDialog
      actions={(
        <>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Import itinerary</Button>
        </>
      )}
      className={importDialogClassName}
      onSubmit={submitImport}
      title="ตั้งค่า import itinerary"
      titleId="itinerary-import-options-title"
    >
      <TripWorkspaceImportDialogSummary
        importedItems={importedItems}
        recordCount={recordCount}
        records={records}
      />
      <TripWorkspaceImportDialogFields
        day={day}
        mode={mode}
        pathNameInput={pathNameInput}
        recordCount={recordCount}
        recordMode={recordMode}
        scope={scope}
        targetTripPlanId={targetTripPlanId}
        tripPlanOptions={tripPlanOptions}
        onDayChange={setDay}
        onModeChange={setMode}
        onPathNameChange={setPathNameInput}
        onRecordModeChange={setRecordMode}
        onScopeChange={setScope}
        onTargetTripPlanChange={setTargetTripPlanId}
      />
    </WorkspaceCompactFormDialog>
  );
}

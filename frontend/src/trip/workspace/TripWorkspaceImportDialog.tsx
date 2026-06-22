import { type FormEvent } from "react";
import { WorkspaceCompactFormDialog } from "@/src/shared/components/workspace-dialog";
import { Button } from "@/src/ui";
import {
  mainItineraryPathName,
  type ItineraryPathOption,
  type ItineraryImportApplyTarget,
} from "@/src/trip/itinerary-paths";
import type {
  ItineraryExportItem,
  ItineraryExportRecords,
} from "@/src/trip/itinerary-import-export";
import type { PlanVariant } from "@/src/trip/types";
import { buildItineraryImportApplyTarget } from "./itinerary-import-target";
import { useTripWorkspaceImportDialogState } from "./trip-workspace-import-dialog-state";
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
  } = useTripWorkspaceImportDialogState({
    currentTripPathId,
    importedItems,
    pathOptions,
    startDate,
    tripPlanId,
  });

  function submitImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const pathName = pathNameInput.trim() || mainItineraryPathName;
    const targetDay = scope === "day" ? day.trim() : undefined;
    if (scope === "day" && !targetDay) return;
    onApply(
      buildItineraryImportApplyTarget({
        day: targetDay,
        memberId,
        mode,
        pathName,
        pathOptions,
        recordMode,
        scope,
        tripPlanId: targetTripPlanId,
      }),
    );
  }

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

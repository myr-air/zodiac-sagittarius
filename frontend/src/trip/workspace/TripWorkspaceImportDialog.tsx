import { useState, type FormEvent } from "react";
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
import {
  TripWorkspaceImportDialogFields,
  TripWorkspaceImportDialogSummary,
} from "./TripWorkspaceImportDialogFields";
import {
  importDialogClassName,
  importDialogTitleClassName,
  workspaceDialogActionsClassName,
  workspaceDialogBackdropClassName,
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
  const currentPathName =
    pathOptions.find((option) => option.id === currentTripPathId)?.name ??
    mainItineraryPathName;
  const [pathNameInput, setPathNameInput] = useState(currentPathName);
  const [scope, setScope] = useState<"trip" | "day">("trip");
  const [day, setDay] = useState(importedItems[0]?.day ?? startDate);
  const [mode, setMode] =
    useState<ItineraryImportApplyTarget["mode"]>("replace-target");
  const [recordMode, setRecordMode] =
    useState<ItineraryImportApplyTarget["recordMode"]>("clone-linked");
  const [targetTripPlanId, setTargetTripPlanId] = useState(tripPlanId);

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
    <div className={workspaceDialogBackdropClassName} role="presentation">
      <form
        className={importDialogClassName}
        role="dialog"
        aria-modal="true"
        aria-labelledby="itinerary-import-options-title"
        onSubmit={submitImport}
      >
        <h2
          className={importDialogTitleClassName}
          id="itinerary-import-options-title"
        >
          ตั้งค่า import itinerary
        </h2>
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
        <div className={workspaceDialogActionsClassName}>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Import itinerary</Button>
        </div>
      </form>
    </div>
  );
}

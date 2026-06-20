import { Select } from "@/src/ui";
import type { ItineraryImportApplyTarget } from "@/src/trip/itinerary-paths";
import type {
  ItineraryExportItem,
  ItineraryExportRecords,
} from "@/src/trip/itinerary-import-export";
import type { PlanVariant } from "@/src/trip/types";
import {
  importDialogFieldsClassName,
  workspaceDialogBodyClassName,
} from "./TripWorkspaceDialog.styles";

interface TripWorkspaceImportDialogSummaryProps {
  importedItems: ItineraryExportItem[];
  recordCount: number;
  records: ItineraryExportRecords;
}

interface TripWorkspaceImportDialogFieldsProps {
  day: string;
  pathNameInput: string;
  recordCount: number;
  recordMode: ItineraryImportApplyTarget["recordMode"];
  scope: ItineraryImportApplyTarget["scope"];
  targetTripPlanId: string;
  tripPlanOptions: PlanVariant[];
  mode: ItineraryImportApplyTarget["mode"];
  onDayChange: (value: string) => void;
  onModeChange: (mode: ItineraryImportApplyTarget["mode"]) => void;
  onPathNameChange: (value: string) => void;
  onRecordModeChange: (recordMode: ItineraryImportApplyTarget["recordMode"]) => void;
  onScopeChange: (scope: ItineraryImportApplyTarget["scope"]) => void;
  onTargetTripPlanChange: (tripPlanId: string) => void;
}

export function TripWorkspaceImportDialogSummary({
  importedItems,
  recordCount,
  records,
}: TripWorkspaceImportDialogSummaryProps) {
  const previewLabel = importedItems[0]?.activity ?? "No activities";

  return (
    <>
      <p className={workspaceDialogBodyClassName}>
        {previewLabel} · {importedItems.length} activities
      </p>
      {recordCount > 0 ? (
        <p className={workspaceDialogBodyClassName}>
          Records detected: {records.expenses.length} expenses,{" "}
          {records.bookingDocs.length} bookings, {records.stopNotes.length}{" "}
          notes, {records.tasks.length} tasks. Linked records will be imported
          only when record handling is set to clone.
        </p>
      ) : null}
    </>
  );
}

export function TripWorkspaceImportDialogFields({
  day,
  mode,
  pathNameInput,
  recordCount,
  recordMode,
  scope,
  targetTripPlanId,
  tripPlanOptions,
  onDayChange,
  onModeChange,
  onPathNameChange,
  onRecordModeChange,
  onScopeChange,
  onTargetTripPlanChange,
}: TripWorkspaceImportDialogFieldsProps) {
  return (
    <div className={importDialogFieldsClassName}>
      <label>
        <span>Target Trip Plan</span>
        <Select
          value={targetTripPlanId}
          onChange={(event) => onTargetTripPlanChange(event.target.value)}
        >
          {tripPlanOptions.map((plan) => (
            <option value={plan.id} key={plan.id}>
              {plan.name}
            </option>
          ))}
        </Select>
      </label>
      <label>
        <span>ชื่อ path</span>
        <input
          value={pathNameInput}
          onChange={(event) => onPathNameChange(event.target.value)}
        />
      </label>
      <label>
        <span>Scope</span>
        <Select
          value={scope}
          onChange={(event) =>
            onScopeChange(event.target.value as ItineraryImportApplyTarget["scope"])
          }
        >
          <option value="trip">Whole trip</option>
          <option value="day">This day only</option>
        </Select>
      </label>
      {scope === "day" ? (
        <label>
          <span>Target day</span>
          <input value={day} onChange={(event) => onDayChange(event.target.value)} />
        </label>
      ) : null}
      <label>
        <span>Mode</span>
        <Select
          value={mode}
          onChange={(event) =>
            onModeChange(event.target.value as ItineraryImportApplyTarget["mode"])
          }
        >
          <option value="replace-target">Replace target path</option>
          <option value="keep-alternatives">Keep both as alternatives</option>
        </Select>
      </label>
      {recordCount > 0 ? (
        <label>
          <span>Record handling</span>
          <Select
            value={recordMode}
            onChange={(event) =>
              onRecordModeChange(
                event.target.value as ItineraryImportApplyTarget["recordMode"],
              )
            }
          >
            <option value="clone-linked">Clone linked records</option>
            <option value="activities-only">Activities only</option>
          </Select>
        </label>
      ) : null}
    </div>
  );
}

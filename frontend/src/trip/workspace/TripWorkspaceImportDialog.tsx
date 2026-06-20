import { useState, type FormEvent } from "react";
import { Button, Select } from "@/src/ui";
import {
  mainItineraryPathName,
  type ItineraryPathOption,
} from "@/src/trip/itinerary";
import type { ItineraryImportApplyTarget } from "@/src/trip/itinerary-paths";
import type {
  ItineraryExportItem,
  ItineraryExportRecords,
} from "@/src/trip/itinerary-import-export";
import type { PlanVariant } from "@/src/trip/types";
import { buildItineraryImportApplyTarget } from "./itinerary-import-target";
import {
  importDialogClassName,
  importDialogFieldsClassName,
  importDialogTitleClassName,
  workspaceDialogActionsClassName,
  workspaceDialogBackdropClassName,
  workspaceDialogBodyClassName,
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
  const previewLabel = importedItems[0]?.activity ?? "No activities";

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
        <p className={workspaceDialogBodyClassName}>
          {previewLabel} · {importedItems.length} activities
        </p>
        {recordCount > 0 ? (
          <p className={workspaceDialogBodyClassName}>
            Records detected: {records.expenses.length} expenses,{" "}
            {records.bookingDocs.length} bookings, {records.stopNotes.length}{" "}
            notes, {records.tasks.length} tasks. Linked records will be
            imported only when record handling is set to clone.
          </p>
        ) : null}
        <div className={importDialogFieldsClassName}>
          <label>
            <span>Target Trip Plan</span>
            <Select
              value={targetTripPlanId}
              onChange={(event) => setTargetTripPlanId(event.target.value)}
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
              onChange={(event) => setPathNameInput(event.target.value)}
            />
          </label>
          <label>
            <span>Scope</span>
            <Select
              value={scope}
              onChange={(event) =>
                setScope(event.target.value as "trip" | "day")
              }
            >
              <option value="trip">Whole trip</option>
              <option value="day">This day only</option>
            </Select>
          </label>
          {scope === "day" ? (
            <label>
              <span>Target day</span>
              <input
                value={day}
                onChange={(event) => setDay(event.target.value)}
              />
            </label>
          ) : null}
          <label>
            <span>Mode</span>
            <Select
              value={mode}
              onChange={(event) =>
                setMode(
                  event.target.value as ItineraryImportApplyTarget["mode"],
                )
              }
            >
              <option value="replace-target">Replace target path</option>
              <option value="keep-alternatives">
                Keep both as alternatives
              </option>
            </Select>
          </label>
          {recordCount > 0 ? (
            <label>
              <span>Record handling</span>
              <Select
                value={recordMode}
                onChange={(event) =>
                  setRecordMode(
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

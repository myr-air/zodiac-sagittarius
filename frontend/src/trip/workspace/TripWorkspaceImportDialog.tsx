import { useState, type FormEvent } from "react";
import { Button, Select } from "@/src/ui";
import { slugifyFilePart } from "@/src/lib/file-names";
import {
  mainItineraryPathId,
  mainItineraryPathName,
  type ItineraryPathOption,
} from "@/src/trip/itinerary";
import type { ItineraryImportApplyTarget } from "@/src/trip/itinerary-paths";
import type {
  ItineraryExportItem,
  ItineraryExportRecords,
} from "@/src/trip/itinerary-import-export";
import type { PlanVariant } from "@/src/trip/types";

const importModalBackdropClassName =
  "modal-backdrop fixed inset-0 z-[80] grid place-items-center bg-[rgb(15_23_42_/_0.28)] p-5";
const importDialogClassName =
  "import-options-dialog grid w-[min(520px,100%)] gap-3 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-4 shadow-[0_14px_34px_rgb(15_23_42_/_0.16)]";
const importDialogTitleClassName =
  "m-0 text-base font-extrabold leading-[22px] text-(--color-text)";
const importDialogBodyClassName =
  "m-0 text-sm font-medium leading-6 text-(--color-text-muted)";
const importDialogFieldsClassName =
  "grid gap-3 [&_label]:grid [&_label]:gap-1.5 [&_label>span]:text-xs [&_label>span]:font-bold [&_label>span]:text-(--color-text-muted) [&_input]:min-h-9 [&_input]:rounded-(--radius-sm) [&_input]:border [&_input]:border-(--color-border) [&_input]:bg-(--color-surface) [&_input]:px-2.5 [&_input]:text-sm [&_select]:min-h-9 [&_select]:rounded-(--radius-sm) [&_select]:border [&_select]:border-(--color-border) [&_select]:bg-(--color-surface) [&_select]:px-2.5 [&_select]:text-sm";
const importDialogActionsClassName = "mt-1 flex justify-end gap-2";

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
    <div className={importModalBackdropClassName} role="presentation">
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
        <p className={importDialogBodyClassName}>
          {previewLabel} · {importedItems.length} activities
        </p>
        {recordCount > 0 ? (
          <p className={importDialogBodyClassName}>
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
        <div className={importDialogActionsClassName}>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Import itinerary</Button>
        </div>
      </form>
    </div>
  );
}

function buildItineraryImportApplyTarget({
  day,
  memberId,
  mode,
  pathName,
  pathOptions,
  recordMode,
  scope,
  tripPlanId,
}: {
  day?: string;
  memberId: string;
  mode: ItineraryImportApplyTarget["mode"];
  pathName: string;
  pathOptions: ItineraryPathOption[];
  recordMode: ItineraryImportApplyTarget["recordMode"];
  scope: ItineraryImportApplyTarget["scope"];
  tripPlanId: string;
}): ItineraryImportApplyTarget {
  const existingPath = pathOptions.find(
    (option) =>
      option.name.toLowerCase() === pathName.toLowerCase() ||
      option.id === pathName,
  );
  const normalizedPathName = pathName.trim();
  const pathId =
    normalizedPathName.toLowerCase() === mainItineraryPathName.toLowerCase()
      ? mainItineraryPathId
      : (existingPath?.id ??
        `path-${slugifyFilePart(normalizedPathName) || Date.now().toString(36)}`);
  const resolvedPathName =
    pathId === mainItineraryPathId
      ? mainItineraryPathName
      : (existingPath?.name ?? pathName);
  return {
    memberId,
    tripPlanId,
    pathId,
    pathName: resolvedPathName,
    scope,
    day,
    mode,
    recordMode,
  };
}

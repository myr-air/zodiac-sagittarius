import { formatDayLabel } from "@/src/trip/itinerary-core";
import { Select } from "@/src/ui";
import { formatThaiDate } from "@/src/features/itinerary/lib/itinerary-display";
import type { Locale } from "@/src/i18n/types";
import {
  type StopDetailType,
  stopDetailLabels,
} from "@/src/features/itinerary/domain/stop-details";
import {
  dialogFieldWideClassName,
} from "./stop-dialog.styles";
import type { StopFormValues, StopManualPathOption } from "./stop-dialog.types";
import { stopDialogFieldIds } from "./stop-dialog-field-ids";

export function StopDialogContextFields({
  dayLabel,
  dayOptions,
  detailLabels,
  detailType,
  detailTypeOptions,
  isSubActivity,
  locale,
  manualPathOptions,
  mode,
  pathLabel,
  startDate,
  typeLabel,
  values,
  onUpdate,
  onUpdateDetailType,
}: {
  dayLabel: string;
  dayOptions: string[];
  detailLabels: ReturnType<typeof stopDetailLabels>;
  detailType: StopDetailType;
  detailTypeOptions: readonly StopDetailType[];
  isSubActivity: boolean;
  locale: Locale;
  manualPathOptions: StopManualPathOption[];
  mode: "create" | "edit";
  pathLabel: string;
  startDate?: string;
  typeLabel: string;
  values: StopFormValues;
  onUpdate: <K extends keyof StopFormValues>(
    key: K,
    value: StopFormValues[K],
  ) => void;
  onUpdateDetailType: (detailType: StopDetailType) => void;
}) {
  return (
    <>
      {mode === "edit" && !isSubActivity && dayOptions.length ? (
        <label className={dialogFieldWideClassName} htmlFor={stopDialogFieldIds.day}>
          <span>{dayLabel}</span>
          <Select
            id={stopDialogFieldIds.day}
            value={values.day}
            onChange={(event) => onUpdate("day", event.target.value)}
          >
            {dayOptions.map((day) => (
              <option value={day} key={day}>
                {formatDayLabel(day, startDate ?? day, locale)} · {formatThaiDate(day, locale)}
              </option>
            ))}
          </Select>
        </label>
      ) : null}
      {mode === "edit" && !isSubActivity && manualPathOptions.length > 1 ? (
        <label className={dialogFieldWideClassName} htmlFor={stopDialogFieldIds.path}>
          <span>{pathLabel}</span>
          <Select
            id={stopDialogFieldIds.path}
            value={values.pathId ?? "main"}
            onChange={(event) => onUpdate("pathId", event.target.value)}
          >
            {manualPathOptions.map((option) => (
              <option value={option.id} key={option.id}>{option.name}</option>
            ))}
          </Select>
        </label>
      ) : null}
      <label htmlFor={stopDialogFieldIds.activityType}>
        <span>{typeLabel}</span>
        <Select
          id={stopDialogFieldIds.activityType}
          value={detailType}
          onChange={(event) =>
            onUpdateDetailType(event.target.value as StopDetailType)
          }
        >
          {detailTypeOptions.map((option) => (
            <option value={option} key={option}>{detailLabels.types[option]}</option>
          ))}
        </Select>
      </label>
    </>
  );
}

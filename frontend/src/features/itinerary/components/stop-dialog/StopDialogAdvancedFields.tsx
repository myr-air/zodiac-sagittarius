import { Select } from "@/src/ui";
import type {
  ItineraryItemKind,
  ItineraryItemPriority,
  ItineraryItemStatus,
  ItineraryTimeMode,
} from "@/src/trip/types";
import {
  itineraryItemKindValues,
  itineraryItemPriorityValues,
  itineraryItemStatusValues,
  itineraryTimeModeValues,
} from "@/src/trip/itinerary-core";
import {
  advancedDetailsClassName,
  advancedDetailsGridClassName,
  dialogFieldWideClassName,
} from "./stop-dialog.styles";
import type { StopFormValues } from "./stop-dialog.types";
import { stopDialogFieldIds } from "./stop-dialog-field-ids";

export function StopDialogAdvancedFields({
  advancedLabel,
  isSubActivity,
  values,
  onUpdate,
  onUpdateTimeMode,
}: {
  advancedLabel: string;
  isSubActivity: boolean;
  values: StopFormValues;
  onUpdate: <K extends keyof StopFormValues>(
    key: K,
    value: StopFormValues[K],
  ) => void;
  onUpdateTimeMode: (timeMode: ItineraryTimeMode) => void;
}) {
  return (
    <details className={advancedDetailsClassName}>
      <summary>{advancedLabel}</summary>
      <div className={advancedDetailsGridClassName}>
        <label htmlFor={stopDialogFieldIds.itemKind}>
          <span>Item kind</span>
          <Select
            id={stopDialogFieldIds.itemKind}
            value={values.itemKind}
            onChange={(event) =>
              onUpdate("itemKind", event.target.value as ItineraryItemKind)
            }
          >
            {itineraryItemKindValues.map((option) => (
              <option value={option} key={option}>{option}</option>
            ))}
          </Select>
        </label>
        <label htmlFor={stopDialogFieldIds.timeMode}>
          <span>Time mode</span>
          <Select
            id={stopDialogFieldIds.timeMode}
            value={values.timeMode}
            onChange={(event) =>
              onUpdateTimeMode(event.target.value as ItineraryTimeMode)
            }
          >
            {itineraryTimeModeValues.map((option) => (
              <option value={option} key={option}>{option}</option>
            ))}
          </Select>
        </label>
        <label htmlFor={stopDialogFieldIds.status}>
          <span>Status</span>
          <Select
            id={stopDialogFieldIds.status}
            value={values.status}
            onChange={(event) =>
              onUpdate("status", event.target.value as ItineraryItemStatus)
            }
          >
            {itineraryItemStatusValues.map((option) => (
              <option value={option} key={option}>{option}</option>
            ))}
          </Select>
        </label>
        <label htmlFor={stopDialogFieldIds.priority}>
          <span>Priority</span>
          <Select
            id={stopDialogFieldIds.priority}
            value={values.priority}
            onChange={(event) =>
              onUpdate("priority", event.target.value as ItineraryItemPriority)
            }
          >
            {itineraryItemPriorityValues.map((option) => (
              <option value={option} key={option}>{option}</option>
            ))}
          </Select>
        </label>
        <label
          className={dialogFieldWideClassName}
          htmlFor={stopDialogFieldIds.isPlanBlock}
        >
          <span>
            <input
              id={stopDialogFieldIds.isPlanBlock}
              type="checkbox"
              checked={values.isPlanBlock && !isSubActivity}
              disabled={isSubActivity}
              onChange={(event) => onUpdate("isPlanBlock", event.target.checked)}
            />
            Plan block
          </span>
        </label>
      </div>
    </details>
  );
}

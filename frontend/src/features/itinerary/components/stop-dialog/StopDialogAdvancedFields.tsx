import { SelectOptions } from "@/src/shared/components/select-options";
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
import { stopDialogValueSelectOptions } from "./stop-dialog-select-options";

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
            <SelectOptions
              options={stopDialogValueSelectOptions(itineraryItemKindValues)}
            />
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
            <SelectOptions
              options={stopDialogValueSelectOptions(itineraryTimeModeValues)}
            />
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
            <SelectOptions
              options={stopDialogValueSelectOptions(itineraryItemStatusValues)}
            />
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
            <SelectOptions
              options={stopDialogValueSelectOptions(itineraryItemPriorityValues)}
            />
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

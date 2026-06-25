import { dialogFieldWideClassName } from "./stop-dialog.styles";
import type { StopDialogPrimaryFieldsProps } from "./stop-dialog.types";
import { stopDialogFieldIds } from "./stop-dialog-field-ids";

export function StopDialogPrimaryFields({
  activityLabel,
  detailType,
  isFocusedEdit,
  noteLabel,
  placeLabel,
  placeSuggestions,
  transportationLabel,
  values,
  onUpdate,
  onUpdateActivity,
}: StopDialogPrimaryFieldsProps) {
  return (
    <>
      <label className={dialogFieldWideClassName} htmlFor={stopDialogFieldIds.activity}>
        <span>{activityLabel}</span>
        <input
          id={stopDialogFieldIds.activity}
          value={values.activity}
          onChange={(event) => onUpdateActivity(event.target.value)}
          required
        />
      </label>
      <label className={dialogFieldWideClassName} htmlFor={stopDialogFieldIds.place}>
        <span>{placeLabel}</span>
        <input
          id={stopDialogFieldIds.place}
          list={placeSuggestions.length ? stopPlaceSuggestionListId : undefined}
          value={values.place}
          onChange={(event) => onUpdate("place", event.target.value)}
          required={detailType !== "transportation"}
        />
        {placeSuggestions.length ? (
          <datalist id={stopPlaceSuggestionListId}>
            {placeSuggestions.map((suggestion) => (
              <option
                key={`${suggestion.kind}:${suggestion.value}`}
                value={suggestion.value}
                label={suggestion.label}
              />
            ))}
          </datalist>
        ) : null}
      </label>
      {!isFocusedEdit && detailType !== "transportation" ? (
        <label className={dialogFieldWideClassName} htmlFor={stopDialogFieldIds.transportation}>
          <span>{transportationLabel}</span>
          <input
            id={stopDialogFieldIds.transportation}
            value={values.transportation}
            onChange={(event) => onUpdate("transportation", event.target.value)}
          />
        </label>
      ) : null}
      {!isFocusedEdit ? (
        <label className={dialogFieldWideClassName} htmlFor={stopDialogFieldIds.note}>
          <span>{noteLabel}</span>
          <textarea
            id={stopDialogFieldIds.note}
            value={values.note}
            onChange={(event) => onUpdate("note", event.target.value)}
            rows={3}
          />
        </label>
      ) : null}
    </>
  );
}

export const stopPlaceSuggestionListId = "stop-place-suggestions";

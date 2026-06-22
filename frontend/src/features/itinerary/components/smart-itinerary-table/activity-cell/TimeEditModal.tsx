import { TimePickerField } from "@/src/shared/components/date-time-pickers";
import {
  timeEditFieldsClassName,
  timeEditFieldClassName,
  timeEditHelperClassName,
  timeEditInputClassName,
  timeEditCancelButtonClassName,
  timeEditModalBackdropClassName,
  timeEditModalBodyClassName,
  timeEditModalClassName,
  timeEditModalFooterClassName,
  timeEditModalHeaderClassName,
  timeEditModalTitleClassName,
  timeEditNextDayClassName,
  timeEditPreviewClassName,
  timeEditPreviewValueClassName,
  timeEditSaveButtonClassName,
} from "../smart-itinerary-table.styles";
import { ActivityCellModalActions } from "./ActivityCellModalActions";
import { ActivityCellModalHeader } from "./ActivityCellModalHeader";
import { ActivityCellModalPortal } from "./ActivityCellModalPortal";
import type { TimeEditModalProps } from "./time-components.types";
import { useTimeEditModalModel } from "./use-time-edit-modal-model";

export function TimeEditModal({
  item,
  itineraryLabels,
  locale,
  onClose,
  onSave,
}: TimeEditModalProps) {
  const {
    endOffsetDays,
    endTime,
    model,
    save,
    saving,
    startTime,
    toggleEndOffsetDays,
    updateEndTime,
    updateStartTime,
  } = useTimeEditModalModel({ item, locale, onClose, onSave });

  return (
    <ActivityCellModalPortal
      backdropClassName={timeEditModalBackdropClassName}
      onClose={onClose}
    >
      <form
        className={timeEditModalClassName}
        role="dialog"
        aria-modal="true"
        aria-label={itineraryLabels.row.inlineTime({ activity: item.activity })}
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => void save(event)}
      >
        <ActivityCellModalHeader
          closeLabel={model.closeLabel}
          headerClassName={timeEditModalHeaderClassName}
          onClose={onClose}
          subtitle={itineraryLabels.row.inlineTime({ activity: item.activity })}
          title={item.activity}
          titleClassName={timeEditModalTitleClassName}
        />
        <div className={timeEditModalBodyClassName}>
          <div className={timeEditFieldsClassName}>
            <label className={timeEditFieldClassName}>
              <span>{model.startLabel}</span>
              <TimePickerField
                className={timeEditInputClassName}
                value={startTime}
                onChange={updateStartTime}
              />
            </label>
            <label className={timeEditFieldClassName}>
              <span>{model.endLabel}</span>
              <TimePickerField
                className={timeEditInputClassName}
                value={endTime}
                onChange={updateEndTime}
              />
            </label>
          </div>
          <p className={timeEditHelperClassName}>
            {model.timeFormatHint} {model.optionalEndHint}
          </p>
          <button
            type="button"
            className={timeEditNextDayClassName}
            aria-pressed={endOffsetDays > 0}
            disabled={!endTime}
            onClick={toggleEndOffsetDays}
          >
            +1 {model.nextDayEndLabel}
          </button>
          <div className={timeEditPreviewClassName}>
            <span>{model.previewLabel}</span>
            <strong className={timeEditPreviewValueClassName}>
              {model.previewWindow}
            </strong>
            <span>{model.durationLabel}</span>
          </div>
          {model.errorMessage ? (
            <p className="text-xs font-bold text-(--color-danger)" role="alert">
              {model.errorMessage}
            </p>
          ) : null}
        </div>
        <footer className={timeEditModalFooterClassName}>
          <ActivityCellModalActions
            cancelClassName={timeEditCancelButtonClassName}
            cancelLabel={itineraryLabels.row.durationCancel}
            onCancel={onClose}
            saveClassName={timeEditSaveButtonClassName}
            saveDisabled={saving || Boolean(model.errorMessage)}
            saveLabel={itineraryLabels.row.durationSave}
          />
        </footer>
      </form>
    </ActivityCellModalPortal>
  );
}

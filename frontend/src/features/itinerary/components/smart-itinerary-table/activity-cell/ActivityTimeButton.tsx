import { useState } from "react";
import {
  activityTimeButtonClassName,
  activityTimeEndClassName,
  activityTimeStartClassName,
} from "../smart-itinerary-table.styles";
import { formatTimeTooltip } from "@/src/features/itinerary/domain/itinerary-item-editing";
import { TimeEditModal } from "./TimeEditModal";
import type { ActivityTimeButtonProps } from "./time-components.types";

export function ActivityTimeButton({
  editable,
  item,
  itineraryLabels,
  locale,
  onSave,
}: ActivityTimeButtonProps) {
  const [timeEditOpen, setTimeEditOpen] = useState(false);
  const timeTooltip = formatTimeTooltip(item, locale);
  const startLabel = item.startTime?.trim() || "--:--";
  const endLabel = item.endTime?.trim()
    ? `${item.endTime.trim()}${item.endOffsetDays ? ` +${item.endOffsetDays}` : ""}`
    : "--:--";

  return (
    <>
      <button
        type="button"
        aria-label={itineraryLabels.row.inlineTime({ activity: item.activity })}
        className={activityTimeButtonClassName}
        disabled={!editable}
        title={timeTooltip}
        onClick={(event) => {
          event.stopPropagation();
          setTimeEditOpen(true);
        }}
      >
        <span className={activityTimeStartClassName}>{startLabel}</span>
        <span className={activityTimeEndClassName}>{endLabel}</span>
      </button>
      {timeEditOpen ? (
        <TimeEditModal
          item={item}
          itineraryLabels={itineraryLabels}
          locale={locale}
          onClose={() => setTimeEditOpen(false)}
          onSave={onSave}
        />
      ) : null}
    </>
  );
}

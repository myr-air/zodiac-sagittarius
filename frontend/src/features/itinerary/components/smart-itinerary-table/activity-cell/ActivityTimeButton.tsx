import { useState } from "react";
import {
  activityTimeButtonClassName,
  activityTimeDurationClassName,
  activityTimeEndClassName,
  activityTimeNextDayClassName,
  activityTimeStartClassName,
} from "../smart-itinerary-table.styles";
import { formatTimeTooltip } from "@/src/features/itinerary/domain/itinerary-item-editing";
import { formatDuration, formatInlineTimeLabels } from "@/src/features/itinerary/domain/itinerary-time-display";
import { Icon } from "@/src/ui/icons";
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
  const { endLabel, startLabel } = formatInlineTimeLabels(item);
  const duration = item.durationMinutes != null ? formatDuration(item.durationMinutes, locale) : null;
  const hasEndTime = item.endTime?.trim();
  const hasNextDay = (item.endOffsetDays ?? 0) > 0;
  const isFullyEmpty = !item.startTime?.trim() && !item.endTime?.trim();
  const isFlexible = item.timeMode === "flexible";

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
        {isFlexible && isFullyEmpty ? (
          <Icon name="clock" title={itineraryLabels.row.flexibleTimeBadge} className="size-3.5" />
        ) : (
          <>
            <span className={activityTimeStartClassName}>{startLabel}</span>
            {duration && <span className={activityTimeDurationClassName}>{duration}</span>}
            {hasEndTime ? (
              <span className={activityTimeEndClassName}>{endLabel}</span>
            ) : null}
            {isFlexible && (
              <Icon name="clock" title={itineraryLabels.row.flexibleTimeBadge} className="size-3.5" />
            )}
          </>
        )}
        {hasNextDay && (
          <span className={activityTimeNextDayClassName}>+{item.endOffsetDays}</span>
        )}
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

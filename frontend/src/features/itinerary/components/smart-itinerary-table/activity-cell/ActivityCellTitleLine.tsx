import { InlineActivityField } from "./InlineActivityField";
import {
  activityMainLineClassName,
  activitySentenceClassName,
  activityTitleInputClassName,
} from "../smart-itinerary-table.styles";
import type { ActivityCellProps } from "./activity-cell.types";

interface ActivityCellTitleLineProps
  extends Pick<
    ActivityCellProps,
    "item" | "itineraryLabels" | "onUpdateItemInline"
  > {
  editable: boolean;
}

export function ActivityCellTitleLine({
  editable,
  item,
  itineraryLabels,
  onUpdateItemInline,
}: ActivityCellTitleLineProps) {
  return (
    <div className={activityMainLineClassName}>
      <div className={activitySentenceClassName}>
        <InlineActivityField
          ariaLabel={itineraryLabels.row.inlineActivity({
            activity: item.activity,
          })}
          autoSize
          className={activityTitleInputClassName}
          disabled={!editable}
          key={`${item.id}:activity:${item.activity}`}
          maxLength={90}
          placeholder="Activity"
          value={item.activity}
          onCommit={(activity) =>
            onUpdateItemInline?.(item.id, { activity: activity || item.activity })
          }
        />
      </div>
    </div>
  );
}

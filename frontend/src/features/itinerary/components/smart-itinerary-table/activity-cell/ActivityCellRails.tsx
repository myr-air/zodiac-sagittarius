import { ActivityTypePicker } from "./ActivityTypePicker";
import { ActivityTimeButton } from "./ActivityTimeButton";
import {
  activityCompactTypePickerClassName,
  activityRailColumnClassName,
  activityTimeRailClassName,
} from "../smart-itinerary-table.styles";
import type { ActivityCellProps } from "./activity-cell.types";

interface ActivityCellRailsProps
  extends Pick<
    ActivityCellProps,
    "item" | "itineraryLabels" | "locale" | "onUpdateItemInline"
  > {
  editable: boolean;
}

export function ActivityCellRails({
  editable,
  item,
  itineraryLabels,
  locale,
  onUpdateItemInline,
}: ActivityCellRailsProps) {
  return (
    <div className={activityRailColumnClassName}>
      <div className={activityTimeRailClassName}>
        <ActivityTimeButton
          editable={editable}
          item={item}
          itineraryLabels={itineraryLabels}
          locale={locale}
          onSave={(patch) => onUpdateItemInline?.(item.id, patch)}
        />
      </div>
      <ActivityTypePicker
        buttonClassName={activityCompactTypePickerClassName}
        disabled={!editable}
        item={item}
        itineraryLabels={itineraryLabels}
        locale={locale}
        onUpdateItemInline={onUpdateItemInline}
      />
    </div>
  );
}

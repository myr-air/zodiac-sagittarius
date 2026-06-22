import { ActivityTypePicker } from "./ActivityTypePicker";
import { ActivityTimeButton } from "./ActivityTimeButton";
import {
  activityMobileTypePickerClassName,
  activityTimeRailClassName,
  activityTypePickerClassName,
  activityTypeRailClassName,
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
    <>
      <div className={activityTimeRailClassName}>
        <ActivityTimeButton
          editable={editable}
          item={item}
          itineraryLabels={itineraryLabels}
          locale={locale}
          onSave={(patch) => onUpdateItemInline?.(item.id, patch)}
        />
        <ActivityTypePicker
          buttonClassName={activityMobileTypePickerClassName}
          disabled={!editable}
          item={item}
          itineraryLabels={itineraryLabels}
          locale={locale}
          onUpdateItemInline={onUpdateItemInline}
        />
      </div>
      <div className={activityTypeRailClassName}>
        <ActivityTypePicker
          buttonClassName={activityTypePickerClassName}
          disabled={!editable}
          item={item}
          itineraryLabels={itineraryLabels}
          locale={locale}
          onUpdateItemInline={onUpdateItemInline}
        />
      </div>
    </>
  );
}

import { ActivityPathGraphDay } from "../activity-path-graph/ActivityPathGraphDay";
import type { DayGroupProps } from "./day-group.types";
import { graphCellClassName } from "./smart-itinerary-table.styles";

interface DayGroupGraphCellProps
  extends Pick<
    DayGroupProps,
    | "canEdit"
    | "graphColumnWidth"
    | "onMoveItemToPath"
    | "onSelectItem"
    | "pathOptions"
    | "selectedItemId"
  > {
  day: string;
  dayLabel: string;
  graphItems: DayGroupProps["graphItems"];
  rowItems: DayGroupProps["group"]["items"];
}

export function DayGroupGraphCell({
  canEdit,
  day,
  dayLabel,
  graphColumnWidth,
  graphItems,
  onMoveItemToPath,
  onSelectItem,
  pathOptions,
  rowItems,
  selectedItemId,
}: DayGroupGraphCellProps) {
  return (
    <td
      className={graphCellClassName}
      rowSpan={Math.max(2, rowItems.length + 2)}
    >
      <ActivityPathGraphDay
        canEdit={canEdit}
        day={day}
        dayLabel={dayLabel}
        graphItems={graphItems}
        graphWidth={graphColumnWidth}
        pathOptions={pathOptions}
        rowItems={rowItems}
        selectedItemId={selectedItemId}
        onMoveItemToPath={onMoveItemToPath}
        onSelectItem={onSelectItem}
      />
    </td>
  );
}

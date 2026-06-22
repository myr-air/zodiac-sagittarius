import { formatDayLabel } from "@/src/trip/itinerary-core";
import { Icon } from "@/src/ui/icons";
import { ActivityPathGraphDay } from "../activity-path-graph/ActivityPathGraphDay";
import {
  groupChildItemsByParent,
  groupTopLevelItems,
} from "./smart-itinerary-table-grouping";
import {
  addStopInlineButtonClassName,
  addStopRowClassName,
  dayGroupClassName,
  daySpacerRowClassName,
  graphCellClassName,
  itemPlaceholderCellClassName,
  itemPlaceholderRowClassName,
} from "./smart-itinerary-table.styles";
import { ActivityCell } from "./activity-cell";
import { DayGroupHeader } from "./DayGroupHeader";
import type { DayGroupProps } from "./day-group.types";

export function DayGroup({
  graphColumnWidth,
  graphItems,
  group,
  dailyBriefing,
  hasTopSpacer,
  itineraryLabels,
  locale,
  startDate,
  pathOptions,
  dayPathOverride,
  showAllPaths,
  selectedItemId,
  canEdit,
  collapsed,
  onAddStop,
  onAddSubActivity,
  onAddNoteForItem,
  onAddBookingForItem,
  onSaveBookingForItem,
  onUnlinkBookingForItem,
  bookingDocs,
  bookingLinkItems,
  onChangeDayPath,
  onClearDayPath,
  onDeleteItem,
  onEditItem,
  onMoveItemToPath,
  onOpenItemDetails,
  onSelectItem,
  onSaveDayTitle,
  onUpdateItemInline,
  onToggleDay,
}: DayGroupProps) {
  const dayA11yLabel = formatDayLabel(group.day, startDate, "en");
  const visibleItems = groupTopLevelItems(group.items);
  const visibleGraphItems = groupTopLevelItems(graphItems);
  const childItemsByParentId = groupChildItemsByParent(group.items);
  const showGraph =
    !collapsed && (visibleGraphItems.length > 0 || visibleItems.length > 0);

  return (
    <tbody
      className={dayGroupClassName}
      data-state={collapsed ? "closed" : "open"}
    >
      {hasTopSpacer ? (
        <tr className={daySpacerRowClassName} aria-hidden="true">
          <td colSpan={2} />
        </tr>
      ) : null}
      <DayGroupHeader
        canEdit={canEdit}
        collapsed={collapsed}
        dailyBriefing={dailyBriefing}
        dayPathOverride={dayPathOverride}
        graphCell={
          showGraph ? (
            <td
              className={graphCellClassName}
              rowSpan={Math.max(2, visibleItems.length + 2)}
            >
              <ActivityPathGraphDay
                canEdit={canEdit}
                day={group.day}
                dayLabel={dayA11yLabel}
                graphItems={visibleGraphItems}
                graphWidth={graphColumnWidth}
                pathOptions={pathOptions}
                rowItems={visibleItems}
                selectedItemId={selectedItemId}
                onMoveItemToPath={onMoveItemToPath}
                onSelectItem={onSelectItem}
              />
            </td>
          ) : null
        }
        group={group}
        itineraryLabels={itineraryLabels}
        locale={locale}
        onChangeDayPath={onChangeDayPath}
        onClearDayPath={onClearDayPath}
        onSaveDayTitle={onSaveDayTitle}
        onToggleDay={onToggleDay}
        pathOptions={pathOptions}
        showAllPaths={showAllPaths}
        showGraph={showGraph}
        startDate={startDate}
      />
      {!collapsed
        ? visibleItems.map((item) => (
            <tr
              aria-label={itineraryLabels.row.openDetails({
                activity: item.activity,
              })}
              className={itemPlaceholderRowClassName}
              data-item-id={item.id}
              data-hierarchy-level={1}
              key={item.id}
            >
              <td className={itemPlaceholderCellClassName}>
                <ActivityCell
                  canEdit={canEdit}
                  item={item}
                  itineraryLabels={itineraryLabels}
                  locale={locale}
                  selected={selectedItemId === item.id}
                  subItems={childItemsByParentId.get(item.id) ?? []}
                  onAddSubActivity={onAddSubActivity}
                  onAddNoteForItem={onAddNoteForItem}
                  onAddBookingForItem={onAddBookingForItem}
                  onSaveBookingForItem={onSaveBookingForItem}
                  onUnlinkBookingForItem={onUnlinkBookingForItem}
                  bookingDocs={bookingDocs}
                  bookingLinkItems={bookingLinkItems}
                  onDeleteItem={onDeleteItem}
                  onEditItem={onEditItem}
                  onOpenItemDetails={onOpenItemDetails}
                  onSelectItem={onSelectItem}
                  onUpdateItemInline={onUpdateItemInline}
                />
              </td>
            </tr>
          ))
        : null}
      {!collapsed ? (
        <tr className={addStopRowClassName} data-day-drop={group.day}>
          <td colSpan={showGraph ? 1 : 2}>
            {canEdit && onAddStop ? (
              <button
                type="button"
                className={addStopInlineButtonClassName}
                onClick={() => onAddStop(group.day)}
              >
                <Icon name="plus" />
                <span>{itineraryLabels.addStop}</span>
              </button>
            ) : null}
          </td>
        </tr>
      ) : null}
    </tbody>
  );
}

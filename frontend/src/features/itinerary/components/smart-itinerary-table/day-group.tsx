import { formatDayLabel } from "@/src/trip/itinerary-core";
import {
  groupChildItemsByParent,
  groupTopLevelItems,
} from "@/src/features/itinerary/domain/itinerary-table-grouping";
import {
  dayGroupClassName,
  daySpacerRowClassName,
} from "./smart-itinerary-table.styles";
import { DayGroupActivityRows } from "./DayGroupActivityRows";
import { DayGroupGraphCell } from "./DayGroupGraphCell";
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
            <DayGroupGraphCell
              canEdit={canEdit}
              day={group.day}
              dayLabel={dayA11yLabel}
              graphColumnWidth={graphColumnWidth}
              graphItems={visibleGraphItems}
              pathOptions={pathOptions}
              rowItems={visibleItems}
              selectedItemId={selectedItemId}
              onMoveItemToPath={onMoveItemToPath}
              onSelectItem={onSelectItem}
            />
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
      {!collapsed ? (
        <DayGroupActivityRows
          bookingDocs={bookingDocs}
          bookingLinkItems={bookingLinkItems}
          canEdit={canEdit}
          childItemsByParentId={childItemsByParentId}
          day={group.day}
          itineraryLabels={itineraryLabels}
          locale={locale}
          selectedItemId={selectedItemId}
          showGraph={showGraph}
          visibleItems={visibleItems}
          onAddBookingForItem={onAddBookingForItem}
          onAddNoteForItem={onAddNoteForItem}
          onAddStop={onAddStop}
          onAddSubActivity={onAddSubActivity}
          onDeleteItem={onDeleteItem}
          onEditItem={onEditItem}
          onOpenItemDetails={onOpenItemDetails}
          onSaveBookingForItem={onSaveBookingForItem}
          onSelectItem={onSelectItem}
          onUnlinkBookingForItem={onUnlinkBookingForItem}
          onUpdateItemInline={onUpdateItemInline}
        />
      ) : null}
    </tbody>
  );
}

import { ActivityTypePicker } from "./ActivityTypePicker";
import { ActivityTimeButton } from "./ActivityTimeButton";
import {
  activityCellClassName,
  activityTimeRailClassName,
  activityTypePickerClassName,
  activityTypeRailClassName,
  activityMobileTypePickerClassName,
} from "../smart-itinerary-table.styles";
import { ActivityCellBody } from "./ActivityCellBody";
import { ActivityCellOverlays } from "./ActivityCellOverlays";
import type { ActivityCellProps } from "./activity-cell.types";
import { useActivityCellModel } from "./use-activity-cell-model";

export function ActivityCell({
  canEdit,
  item,
  itineraryLabels,
  locale,
  selected,
  subItems,
  onAddSubActivity,
  onAddNoteForItem,
  onAddBookingForItem,
  onSaveBookingForItem,
  onUnlinkBookingForItem,
  bookingDocs,
  bookingLinkItems,
  onDeleteItem,
  onEditItem,
  onOpenItemDetails,
  onSelectItem,
  onUpdateItemInline,
}: ActivityCellProps) {
  const {
    actionMenuLabel,
    actionsExpanded,
    editable,
    noteTarget,
    openNoteModal,
    openSubActivityModal,
    setActionsExpanded,
    setNoteTarget,
    setSubActivityModalOpen,
    showSubActivityToggle,
    status,
    subActivitiesExpanded,
    subActivityModalOpen,
    toggleSubActivities,
  } = useActivityCellModel({
    canEdit,
    item,
    locale,
    onAddSubActivity,
    onUpdateItemInline,
    subItems,
  });

  return (
    <div
      className={activityCellClassName}
      data-selected={selected ? "true" : undefined}
      onClick={() => onSelectItem(item.id)}
    >
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
      <ActivityCellBody
        actionMenuLabel={actionMenuLabel}
        actionsExpanded={actionsExpanded}
        bookingDocs={bookingDocs}
        bookingLinkItems={bookingLinkItems}
        editable={editable}
        item={item}
        itineraryLabels={itineraryLabels}
        locale={locale}
        onAddBookingForItem={onAddBookingForItem}
        onAddNoteForItem={onAddNoteForItem}
        onCloseCompactActions={() => setActionsExpanded(false)}
        onDeleteItem={onDeleteItem}
        onEditItem={onEditItem}
        onOpenItemDetails={onOpenItemDetails}
        onOpenNoteForItem={openNoteModal}
        onOpenSubActivityModal={openSubActivityModal}
        onSaveBookingForItem={onSaveBookingForItem}
        onToggleActions={() => setActionsExpanded((current) => !current)}
        onToggleSubActivities={toggleSubActivities}
        onUnlinkBookingForItem={onUnlinkBookingForItem}
        onUpdateItemInline={onUpdateItemInline}
        showSubActivityToggle={showSubActivityToggle}
        status={status}
        subActivitiesExpanded={subActivitiesExpanded}
      />
      <ActivityCellOverlays
        bookingDocs={bookingDocs}
        bookingLinkItems={bookingLinkItems}
        canEdit={canEdit}
        item={item}
        itineraryLabels={itineraryLabels}
        locale={locale}
        noteTarget={noteTarget}
        onAddBookingForItem={onAddBookingForItem}
        onAddNoteForItem={onAddNoteForItem}
        onAddSubActivity={onAddSubActivity}
        onCloseNote={() => setNoteTarget(null)}
        onCloseSubActivityModal={() => setSubActivityModalOpen(false)}
        onDeleteItem={onDeleteItem}
        onEditItem={onEditItem}
        onOpenNoteForItem={openNoteModal}
        onSaveBookingForItem={onSaveBookingForItem}
        onUnlinkBookingForItem={onUnlinkBookingForItem}
        onUpdateItemInline={onUpdateItemInline}
        selected={selected}
        subActivitiesExpanded={subActivitiesExpanded}
        subActivityModalOpen={subActivityModalOpen}
        subItems={subItems}
      />
    </div>
  );
}

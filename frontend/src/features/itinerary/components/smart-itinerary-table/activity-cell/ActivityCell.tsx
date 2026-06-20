import { ActivityLocationLine } from "./ActivityLocationLine";
import { ActivityTypePicker } from "./ActivityTypePicker";
import { ActivityTimeButton } from "./ActivityTimeButton";
import { ActivityCellActionGroup } from "./ActivityCellActionGroup";
import { ActivityCellTitleLine } from "./ActivityCellTitleLine";
import {
  activityBodyClassName,
  activityCellClassName,
  activityTimeRailClassName,
  activityTypePickerClassName,
  activityTypeRailClassName,
  activityMobileTypePickerClassName,
  activityTabletActionLayerClassName,
} from "../smart-itinerary-table.styles";
import { ActivitySubActivityToggle } from "./ActivityCellControls";
import { ActivityCellMeta } from "./ActivityCellMeta";
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

  const renderSubActivityButton = (compact = false) =>
    showSubActivityToggle ? (
      <ActivitySubActivityToggle
        activity={item.activity}
        expanded={subActivitiesExpanded}
        onOpenCompact={() => openSubActivityModal(compact)}
        onToggleExpanded={() => toggleSubActivities(compact)}
      />
    ) : null;
  const renderActivityActions = (compact = false) => (
    <ActivityCellActionGroup
      compact={compact}
      item={item}
      itineraryLabels={itineraryLabels}
      locale={locale}
      onAddNoteForItem={onAddNoteForItem}
      onCompactActionComplete={() => setActionsExpanded(false)}
      onDeleteItem={onDeleteItem}
      onEditItem={onEditItem}
      onOpenItemDetails={onOpenItemDetails}
      onOpenNoteForItem={openNoteModal}
    />
  );

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
      <div className={activityBodyClassName}>
        <ActivityCellTitleLine
          editable={editable}
          item={item}
          itineraryLabels={itineraryLabels}
          onUpdateItemInline={onUpdateItemInline}
        />
        <ActivityLocationLine
          editable={editable}
          item={item}
          itineraryLabels={itineraryLabels}
          onUpdateItemInline={onUpdateItemInline}
        />
        <ActivityCellMeta
          actionMenuLabel={actionMenuLabel}
          actionsExpanded={actionsExpanded}
          bookingDocs={bookingDocs}
          bookingLinkItems={bookingLinkItems}
          item={item}
          itineraryLabels={itineraryLabels}
          locale={locale}
          onAddBookingForItem={onAddBookingForItem}
          onSaveBookingForItem={onSaveBookingForItem}
          onToggleActions={() => setActionsExpanded((current) => !current)}
          onUnlinkBookingForItem={onUnlinkBookingForItem}
          renderActivityActions={renderActivityActions}
          renderSubActivityButton={renderSubActivityButton}
          status={status}
        />
        {actionsExpanded ? (
          <div
            className={activityTabletActionLayerClassName}
            aria-label={actionMenuLabel}
            onClick={(event) => event.stopPropagation()}
          >
            {renderActivityActions(true)}
          </div>
        ) : null}
      </div>
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

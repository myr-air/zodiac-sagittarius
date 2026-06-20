import { ActivityLocationLine } from "./activity-cell/ActivityLocationLine";
import { ActivityTypePicker } from "./activity-cell/ActivityTypePicker";
import { InlineActivityField } from "./activity-cell/InlineActivityField";
import { ActivityTimeButton } from "./activity-cell/ActivityTimeButton";
import { SubActivityList } from "./activity-cell/SubActivityList";
import { SubActivityModal } from "./activity-cell/SubActivityModal";
import { ActivityActionButtons } from "./activity-cell/ActivityActionButtons";
import {
  activityBodyClassName,
  activityCellClassName,
  activityMainLineClassName,
  activitySentenceClassName,
  activityTimeRailClassName,
  activityTitleInputClassName,
  activityTypePickerClassName,
  activityTypeRailClassName,
  activityMobileTypePickerClassName,
  activityTabletActionLayerClassName,
} from "./smart-itinerary-table.styles";
import { ItineraryNoteModal } from "./activity-cell/ItineraryNoteModal";
import { ActivitySubActivityToggle } from "./activity-cell/ActivityCellControls";
import { ActivityCellMeta } from "./activity-cell/ActivityCellMeta";
import type { ActivityCellProps } from "./activity-cell/activity-cell.types";
import { useActivityCellModel } from "./activity-cell/use-activity-cell-model";

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
    <ActivityActionButtons
      item={item}
      itineraryLabels={itineraryLabels}
      locale={locale}
      onActionComplete={
        compact ? () => setActionsExpanded(false) : undefined
      }
      onDeleteItem={onDeleteItem}
      onEditItem={onEditItem}
      onOpenItemDetails={onOpenItemDetails}
      onOpenNoteForItem={
        onAddNoteForItem
          ? (target) => openNoteModal(target, compact)
          : undefined
      }
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
        {subActivityModalOpen ? (
          <SubActivityModal
            canEdit={canEdit}
            item={item}
            itineraryLabels={itineraryLabels}
            locale={locale}
            subItems={subItems}
            onAddSubActivity={onAddSubActivity}
            onAddNoteForItem={onAddNoteForItem}
            onOpenNoteForItem={openNoteModal}
            onClose={() => setSubActivityModalOpen(false)}
            onDeleteItem={onDeleteItem}
            onEditItem={onEditItem}
            onAddBookingForItem={onAddBookingForItem}
            onSaveBookingForItem={onSaveBookingForItem}
            onUnlinkBookingForItem={onUnlinkBookingForItem}
            bookingDocs={bookingDocs}
            bookingLinkItems={bookingLinkItems}
            onUpdateItemInline={onUpdateItemInline}
          />
        ) : null}
      </div>
      <SubActivityList
        canEdit={canEdit}
        item={item}
        itineraryLabels={itineraryLabels}
        locale={locale}
        selected={selected}
        subItems={subItems}
        onAddSubActivity={onAddSubActivity}
        onAddNoteForItem={onAddNoteForItem}
        onOpenNoteForItem={openNoteModal}
        onAddBookingForItem={onAddBookingForItem}
        onSaveBookingForItem={onSaveBookingForItem}
        onUnlinkBookingForItem={onUnlinkBookingForItem}
        bookingDocs={bookingDocs}
        bookingLinkItems={bookingLinkItems}
        onDeleteItem={onDeleteItem}
        onEditItem={onEditItem}
        onUpdateItemInline={onUpdateItemInline}
        visible={subActivitiesExpanded || (selected && subItems.length === 0)}
      />
      {noteTarget && onAddNoteForItem ? (
        <ItineraryNoteModal
          item={noteTarget}
          locale={locale}
          onClose={() => setNoteTarget(null)}
          onSave={async (body) => {
            await onAddNoteForItem(noteTarget.id, body);
            setNoteTarget(null);
          }}
        />
      ) : null}
    </div>
  );
}

export { InlineActivityField } from "./activity-cell/InlineActivityField";
export { ActivityTypePicker } from "./activity-cell/ActivityTypePicker";
export { ActivityLocationLine } from "./activity-cell/ActivityLocationLine";

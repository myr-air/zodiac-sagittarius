import { ActivityCellActionGroup } from "./ActivityCellActionGroup";
import { ActivityCellMeta } from "./ActivityCellMeta";
import { ActivitySubActivityToggle } from "./ActivityCellControls";
import { ActivityCellTitleLine } from "./ActivityCellTitleLine";
import { ActivityLocationLine } from "./ActivityLocationLine";
import {
  activityBodyClassName,
  activityNoteLineClassName,
  activityTabletActionLayerClassName,
} from "../smart-itinerary-table.styles";
import type { ActivityCellProps } from "./activity-cell.types";

interface ActivityCellBodyProps
  extends Pick<
    ActivityCellProps,
    | "bookingDocs"
    | "bookingLinkItems"
    | "itineraryLabels"
    | "item"
    | "locale"
    | "onAddBookingForItem"
    | "onAddNoteForItem"
    | "onDeleteItem"
    | "onEditItem"
    | "onOpenItemDetails"
    | "onSaveBookingForItem"
    | "onUnlinkBookingForItem"
    | "onUpdateItemInline"
  > {
  actionMenuLabel: string;
  actionsExpanded: boolean;
  editable: boolean;
  onCloseCompactActions: () => void;
  onOpenNoteForItem: (target: ActivityCellProps["item"], compact?: boolean) => void;
  onOpenSubActivityModal: (compact?: boolean) => void;
  onToggleActions: () => void;
  onToggleSubActivities: (compact?: boolean) => void;
  showSubActivityToggle: boolean;
  status: string | null;
  subActivitiesExpanded: boolean;
}

export function ActivityCellBody({
  actionMenuLabel,
  actionsExpanded,
  bookingDocs,
  bookingLinkItems,
  editable,
  item,
  itineraryLabels,
  locale,
  onAddBookingForItem,
  onAddNoteForItem,
  onCloseCompactActions,
  onDeleteItem,
  onEditItem,
  onOpenItemDetails,
  onOpenNoteForItem,
  onOpenSubActivityModal,
  onSaveBookingForItem,
  onToggleActions,
  onToggleSubActivities,
  onUnlinkBookingForItem,
  onUpdateItemInline,
  showSubActivityToggle,
  status,
  subActivitiesExpanded,
}: ActivityCellBodyProps) {
  const renderSubActivityButton = (compact = false) =>
    showSubActivityToggle ? (
      <ActivitySubActivityToggle
        activity={item.activity}
        expanded={subActivitiesExpanded}
        onOpenCompact={() => onOpenSubActivityModal(compact)}
        onToggleExpanded={() => onToggleSubActivities(compact)}
      />
    ) : null;
  const renderActivityActions = (compact = false) => (
    <ActivityCellActionGroup
      compact={compact}
      item={item}
      itineraryLabels={itineraryLabels}
      locale={locale}
      onAddNoteForItem={onAddNoteForItem}
      onCompactActionComplete={onCloseCompactActions}
      onDeleteItem={onDeleteItem}
      onEditItem={onEditItem}
      onOpenItemDetails={onOpenItemDetails}
      onOpenNoteForItem={onOpenNoteForItem}
      onUpdateItemInline={onUpdateItemInline}
    />
  );

  return (
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
      {item.note?.trim() ? (
        <div className={activityNoteLineClassName}>{item.note}</div>
      ) : null}
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
        onToggleActions={onToggleActions}
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
  );
}

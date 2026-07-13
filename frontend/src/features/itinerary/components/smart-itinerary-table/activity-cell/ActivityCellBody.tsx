import { useState } from "react";
import { ActivityCellActionGroup } from "./ActivityCellActionGroup";
import { ActivityCellMeta } from "./ActivityCellMeta";
import { ActivitySubActivityToggle } from "./ActivityCellControls";
import { ActivityIdentityLine } from "./ActivityIdentityLine";
import { Icon } from "@/src/ui/icons";
import {
  activityBodyClassName,
  activityDetailsSectionClassName,
  activityDetailsToggleClassName,
  activityNoteLineClassName,
  activityTabletActionLayerClassName,
  activityTransportLineClassName,
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
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const hasDetails =
    Boolean(item.note?.trim()) ||
    (item.activityType !== "travel" && Boolean(item.transportation?.trim()));

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
      <div className="flex min-w-0 items-baseline gap-1">
        <ActivityIdentityLine
          editable={editable}
          item={item}
          itineraryLabels={itineraryLabels}
          onUpdateItemInline={onUpdateItemInline}
        />
        {hasDetails ? (
          <button
            type="button"
            className={activityDetailsToggleClassName}
            aria-expanded={detailsExpanded}
            aria-label={
              detailsExpanded
                ? itineraryLabels.row.collapseDetails({
                    activity: item.activity,
                  })
                : itineraryLabels.row.expandDetails({
                    activity: item.activity,
                  })
            }
            onClick={() => setDetailsExpanded((prev) => !prev)}
          >
            <Icon
              name={detailsExpanded ? "chevronDown" : "chevronRight"}
            />
          </button>
        ) : null}
      </div>
      {detailsExpanded ? (
        <div className={activityDetailsSectionClassName}>
          {item.note?.trim() ? (
            <div className={activityNoteLineClassName}>{item.note}</div>
          ) : null}
          {item.activityType !== "travel" && item.transportation?.trim() ? (
            <div className={activityTransportLineClassName}>
              <Icon name="route" />
              <span>{item.transportation}</span>
            </div>
          ) : null}
        </div>
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

import { useState } from "react";
import type {
  BookingDoc,
  ItineraryItem,
} from "@/src/trip/types";
import { Icon } from "@/src/ui/icons";
import type { Locale } from "@/src/i18n/types";
import type { Messages } from "@/src/i18n/messages";
import type { InlineItineraryItemPatch } from "../../lib";
import type {
  ItineraryBookingTemplate,
  ItineraryBookingTicketInput,
} from "@/src/trip/booking-docs";
import { itemStatusLabel } from "./smart-itinerary-table-utils";
import { formatDuration } from "../../lib";
import { ActivityLocationLine } from "./activity-cell/ActivityLocationLine";
import { ActivityTypePicker } from "./activity-cell/ActivityTypePicker";
import { InlineActivityField } from "./activity-cell/InlineActivityField";
import { ItineraryBookingButton } from "./activity-cell/BookingComponents";
import { ActivityTimeButton } from "./activity-cell/TimeComponents";
import { SubActivityList, SubActivityModal } from "./activity-cell/SubActivityComponents";
import { ActivityActionButtons } from "./activity-cell/ActivityActionButtons";
import {
  activityActionClusterClassName,
  activityActionsClassName,
  activityBodyClassName,
  activityCellClassName,
  activityMainLineClassName,
  activityMetaClassName,
  activityMetaStatusClassName,
  activityMobileLineClassName,
  activityMobileStatusClassName,
  activityPillClassName,
  activitySentenceClassName,
  activityTimeRailClassName,
  activityTitleInputClassName,
  activityTypePickerClassName,
  activityTypeRailClassName,
  activityMobileTypePickerClassName,
  activityTabletActionLayerClassName,
} from "./smart-itinerary-table.styles";
import { ItineraryNoteModal } from "./activity-cell/ItineraryNoteModal";
import { ActivityMoreActionsButton, ActivitySubActivityToggle } from "./activity-cell/ActivityCellControls";

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
}: {
  canEdit: boolean;
  item: ItineraryItem;
  itineraryLabels: Messages["itinerary"];
  locale: Locale;
  selected: boolean;
  subItems: ItineraryItem[];
  bookingDocs: BookingDoc[];
  bookingLinkItems: ItineraryItem[];
  onAddSubActivity?: (parentItemId: string) => void | Promise<void>;
  onAddNoteForItem?: (itemId: string, body: string) => void | Promise<void>;
  onAddBookingForItem?: (
    itemId: string,
    template?: ItineraryBookingTemplate,
  ) => string | void | Promise<string | void>;
  onSaveBookingForItem?: (
    input: ItineraryBookingTicketInput,
  ) => string | void | Promise<string | void>;
  onUnlinkBookingForItem?: (
    bookingDocId: string,
    itemId: string,
  ) => void | Promise<void>;
  onDeleteItem?: (itemId: string) => void;
  onEditItem?: (itemId: string) => void;
  onOpenItemDetails: (itemId: string) => void;
  onSelectItem: (itemId: string) => void;
  onUpdateItemInline?: (
    itemId: string,
    patch: InlineItineraryItemPatch,
  ) => void | Promise<void>;
}) {
  const editable = canEdit && Boolean(onUpdateItemInline);
  const status = item.status ? itemStatusLabel(item.status, locale) : null;
  const [subActivityModalOpen, setSubActivityModalOpen] = useState(false);
  const [subActivitiesExpanded, setSubActivitiesExpanded] = useState(false);
  const [actionsExpanded, setActionsExpanded] = useState(false);
  const [noteTarget, setNoteTarget] = useState<ItineraryItem | null>(null);
  const showSubActivityToggle =
    Boolean(onAddSubActivity) || subItems.length > 0;
  const actionMenuLabel =
    locale === "th"
      ? `จัดการกิจกรรม ${item.activity}`
      : `Activity actions for ${item.activity}`;
  function openNoteModal(target: ItineraryItem, compact = false) {
    if (compact) {
      setActionsExpanded(false);
    }
    setNoteTarget(target);
  }

  const renderSubActivityButton = (compact = false) =>
    showSubActivityToggle ? (
      <ActivitySubActivityToggle
        activity={item.activity}
        expanded={subActivitiesExpanded}
        onOpenCompact={() => {
          if (compact) {
            setActionsExpanded(false);
          }
          setSubActivityModalOpen(true);
        }}
        onToggleExpanded={() => {
          if (compact) {
            setActionsExpanded(false);
          }
          setSubActivitiesExpanded((current) => !current);
        }}
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
        <div className={activityMobileLineClassName}>
          {status ? <span className={activityMobileStatusClassName}>{status}</span> : null}
          <ItineraryBookingButton
            item={item}
            itineraryLabels={itineraryLabels}
            locale={locale}
            onAddBookingForItem={onAddBookingForItem}
            onSaveBookingForItem={onSaveBookingForItem}
            onUnlinkBookingForItem={onUnlinkBookingForItem}
            bookingDocs={bookingDocs}
            bookingLinkItems={bookingLinkItems}
          />
          <span className={activityActionClusterClassName}>
            {renderSubActivityButton(true)}
            <ActivityMoreActionsButton
              expanded={actionsExpanded}
              label={actionMenuLabel}
              onToggle={() => setActionsExpanded((current) => !current)}
            />
          </span>
        </div>
        <div className={activityMetaClassName}>
          <div className={activityMetaStatusClassName}>
            {status ? <span className={activityPillClassName}>{status}</span> : null}
            <ItineraryBookingButton
              item={item}
              itineraryLabels={itineraryLabels}
              locale={locale}
              onAddBookingForItem={onAddBookingForItem}
              onSaveBookingForItem={onSaveBookingForItem}
              onUnlinkBookingForItem={onUnlinkBookingForItem}
              bookingDocs={bookingDocs}
              bookingLinkItems={bookingLinkItems}
            />
            {item.durationMinutes ? (
              <span className={activityPillClassName}>
                <Icon name="clock" className="size-3.5" />
                {formatDuration(item.durationMinutes, locale)}
              </span>
            ) : null}
            {item.transportation ? (
              <span className="min-w-0 truncate">
                {item.transportation}
              </span>
            ) : null}
          </div>
          <div className={activityActionClusterClassName}>
            <span className={activityActionsClassName}>
              {renderActivityActions()}
            </span>
            {renderSubActivityButton()}
            <ActivityMoreActionsButton
              expanded={actionsExpanded}
              label={actionMenuLabel}
              onToggle={() => setActionsExpanded((current) => !current)}
            />
          </div>
        </div>
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

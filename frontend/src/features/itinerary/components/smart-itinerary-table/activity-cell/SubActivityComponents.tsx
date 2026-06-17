import { createPortal } from "react-dom";

import { cn } from "@/src/lib/cn";
import { Icon } from "@/src/ui/icons";
import type { Locale } from "@/src/i18n/types";
import type { Messages } from "@/src/i18n/messages";
import type { BookingDoc, ItineraryItem } from "@/src/trip/types";
import type { ItineraryBookingTemplate, ItineraryBookingTicketInput } from "@/src/trip/booking-docs";
import type { InlineItineraryItemPatch } from "../../../lib";

import { ActivityLocationLine } from "./ActivityLocationLine";
import { ActivityTypePicker } from "./ActivityTypePicker";
import { InlineActivityField } from "./InlineActivityField";
import { ItineraryBookingButton } from "./BookingComponents";
import { ActivityTimeButton } from "./TimeComponents";
import { ActivityActionButtons } from "./ActivityActionButtons";
import { useEscapeToClose } from "./use-escape-close";
import {
  addSubActivityButtonClassName,
  subActivityActionsClassName,
  subActivityLineClassName,
  subActivityListClassName,
  subActivityModalBackdropClassName,
  subActivityModalBodyClassName,
  subActivityModalClassName,
  subActivityModalCloseClassName,
  subActivityModalHeaderClassName,
  subActivityModalListClassName,
  subActivityModalTitleClassName,
  subActivityTextClassName,
  subActivityTitleInputClassName,
  activityMobileTypePickerClassName,
} from "../../smart-itinerary-table.styles";

export function SubActivityModal({
  canEdit,
  item,
  itineraryLabels,
  locale,
  onAddSubActivity,
  onAddNoteForItem,
  onOpenNoteForItem,
  onAddBookingForItem,
  onSaveBookingForItem,
  onUnlinkBookingForItem,
  bookingDocs,
  bookingLinkItems,
  onClose,
  onDeleteItem,
  onEditItem,
  onUpdateItemInline,
  subItems,
}: {
  canEdit: boolean;
  item: ItineraryItem;
  itineraryLabels: Messages["itinerary"];
  locale: Locale;
  subItems: ItineraryItem[];
  onAddSubActivity?: (parentItemId: string) => void | Promise<void>;
  onAddNoteForItem?: (itemId: string, body: string) => void | Promise<void>;
  onOpenNoteForItem?: (item: ItineraryItem, compact?: boolean) => void;
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
  bookingDocs: BookingDoc[];
  bookingLinkItems: ItineraryItem[];
  onClose: () => void;
  onDeleteItem?: (itemId: string) => void;
  onEditItem?: (itemId: string) => void;
  onUpdateItemInline?: (
    itemId: string,
    patch: InlineItineraryItemPatch,
  ) => void | Promise<void>;
}) {
  useEscapeToClose(onClose);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={subActivityModalBackdropClassName}
      role="presentation"
      onClick={onClose}
    >
      <section
        className={subActivityModalClassName}
        role="dialog"
        aria-modal="true"
        aria-label={`Sub-activities for ${item.activity}`}
        onClick={(event) => event.stopPropagation()}
      >
        <header className={subActivityModalHeaderClassName}>
          <strong className={subActivityModalTitleClassName}>
            <span>{item.activity}</span>
            <small>{itineraryLabels.row.subItemQuick}</small>
          </strong>
          <button
            type="button"
            className={subActivityModalCloseClassName}
            aria-label="Close sub-activities"
            onClick={onClose}
          >
            <Icon name="x" />
          </button>
        </header>
        <div className={subActivityModalBodyClassName}>
          <SubActivityList
            canEdit={canEdit}
            item={item}
            itineraryLabels={itineraryLabels}
            locale={locale}
            presentation="modal"
            selected
            subItems={subItems}
            onAddSubActivity={onAddSubActivity}
            onAddNoteForItem={onAddNoteForItem}
            onOpenNoteForItem={onOpenNoteForItem}
            onAddBookingForItem={onAddBookingForItem}
            onSaveBookingForItem={onSaveBookingForItem}
            onUnlinkBookingForItem={onUnlinkBookingForItem}
            bookingDocs={bookingDocs}
            bookingLinkItems={bookingLinkItems}
            onDeleteItem={onDeleteItem}
            onEditItem={onEditItem}
            onUpdateItemInline={onUpdateItemInline}
          />
        </div>
      </section>
    </div>,
    document.body,
  );
}

export function SubActivityList({
  canEdit,
  item,
  itineraryLabels,
  locale,
  presentation = "inline",
  selected,
  subItems,
  visible = true,
  onAddSubActivity,
  onAddNoteForItem,
  onOpenNoteForItem,
  onAddBookingForItem,
  onSaveBookingForItem,
  onUnlinkBookingForItem,
  bookingDocs,
  bookingLinkItems,
  onDeleteItem,
  onEditItem,
  onUpdateItemInline,
}: {
  canEdit: boolean;
  item: ItineraryItem;
  itineraryLabels: Messages["itinerary"];
  locale: Locale;
  presentation?: "inline" | "modal";
  selected: boolean;
  subItems: ItineraryItem[];
  visible?: boolean;
  onAddSubActivity?: (parentItemId: string) => void | Promise<void>;
  onAddNoteForItem?: (itemId: string, body: string) => void | Promise<void>;
  onOpenNoteForItem?: (item: ItineraryItem, compact?: boolean) => void;
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
  bookingDocs: BookingDoc[];
  bookingLinkItems: ItineraryItem[];
  onDeleteItem?: (itemId: string) => void;
  onEditItem?: (itemId: string) => void;
  onUpdateItemInline?: (
    itemId: string,
    patch: InlineItineraryItemPatch,
  ) => void | Promise<void>;
}) {
  const editable = canEdit && Boolean(onUpdateItemInline);
  const showAddSubActivity =
    Boolean(onAddSubActivity) &&
    (presentation === "modal" || visible || selected || subItems.length > 0);

  if (presentation === "inline" && !visible) return null;
  if (subItems.length === 0 && !showAddSubActivity) return null;

  return (
    <div
      className={
        presentation === "modal"
          ? subActivityModalListClassName
          : subActivityListClassName
      }
    >
      {subItems.map((subItem) => (
        <div
          className={cn(subActivityLineClassName, subActivityTextClassName)}
          data-sub-item-id={subItem.id}
          key={subItem.id}
        >
          <span className="max-[760px]:hidden">
            <ActivityTimeButton
              editable={editable}
              item={subItem}
              itineraryLabels={itineraryLabels}
              locale={locale}
              onSave={(patch) => onUpdateItemInline?.(subItem.id, patch)}
            />
          </span>
          <div className={subActivityTextClassName}>
            <InlineActivityField
              ariaLabel={itineraryLabels.row.inlineActivity({
                activity: subItem.activity,
              })}
              autoSize
              className={subActivityTitleInputClassName}
              disabled={!editable}
              key={`${subItem.id}:activity:${subItem.activity}`}
              maxLength={80}
              placeholder="Sub-activity"
              value={subItem.activity}
              onCommit={(activity) =>
                onUpdateItemInline?.(subItem.id, {
                  activity: activity || subItem.activity,
                })
              }
            />
            <ActivityLocationLine
              editable={editable}
              item={subItem}
              itineraryLabels={itineraryLabels}
              onUpdateItemInline={onUpdateItemInline}
            />
          </div>
          <div className={subActivityActionsClassName}>
            <ActivityActionButtons
              iconClassName="size-4"
              item={subItem}
              itineraryLabels={itineraryLabels}
              locale={locale}
              showDelete={false}
              showDetails={false}
              showEdit={false}
              showNote={false}
            />
            <ItineraryBookingButton
              item={subItem}
              itineraryLabels={itineraryLabels}
              locale={locale}
              onAddBookingForItem={onAddBookingForItem}
              onSaveBookingForItem={onSaveBookingForItem}
              onUnlinkBookingForItem={onUnlinkBookingForItem}
              bookingDocs={bookingDocs}
              bookingLinkItems={bookingLinkItems}
            />
            <ActivityTypePicker
              buttonClassName={cn(activityMobileTypePickerClassName, "!inline-flex !w-7 max-[520px]:!inline-flex")}
              disabled={!editable}
              item={subItem}
              itineraryLabels={itineraryLabels}
              locale={locale}
              onUpdateItemInline={onUpdateItemInline}
            />
            <ActivityActionButtons
              iconClassName="size-4"
              item={subItem}
              itineraryLabels={itineraryLabels}
              locale={locale}
              onDeleteItem={onDeleteItem}
              onEditItem={onEditItem}
              onOpenNoteForItem={
                onAddNoteForItem && onOpenNoteForItem
                  ? onOpenNoteForItem
                  : undefined
              }
              showDetails={false}
              showMap={false}
            />
          </div>
        </div>
      ))}
      {showAddSubActivity ? (
        <button
          type="button"
          className={addSubActivityButtonClassName}
          disabled={!canEdit}
          onClick={(event) => {
            event.stopPropagation();
            void onAddSubActivity?.(item.id);
          }}
        >
          <Icon name="plus" className="size-4" />
          {itineraryLabels.row.subItemQuick}
        </button>
      ) : null}
    </div>
  );
}

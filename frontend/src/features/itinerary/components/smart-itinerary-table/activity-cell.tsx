import { type FormEvent, useState } from "react";
import { createPortal } from "react-dom";
import type {
  BookingDoc,
  ItineraryItem,
} from "@/src/trip/types";
import { cn } from "@/src/lib/cn";
import { Icon } from "@/src/ui/icons";
import type { Locale } from "@/src/i18n/types";
import type { Messages } from "@/src/i18n/messages";
import type { InlineItineraryItemPatch } from "../../lib";
import type {
  ItineraryBookingTemplate,
  ItineraryBookingTicketInput,
} from "@/src/trip/booking-docs";
import { itemStatusLabel } from "../smart-itinerary-table-utils";
import { formatDuration } from "../../lib";
import { ActivityLocationLine } from "./activity-cell/ActivityLocationLine";
import { ActivityTypePicker } from "./activity-cell/ActivityTypePicker";
import { InlineActivityField } from "./activity-cell/InlineActivityField";
import { ItineraryBookingButton } from "./activity-cell/BookingComponents";
import { ActivityTimeButton } from "./activity-cell/TimeComponents";
import { SubActivityList, SubActivityModal } from "./activity-cell/SubActivityComponents";
import { useEscapeToClose } from "./activity-cell/use-escape-close";
import {
  itemPlaceholderCellClassName,
  itemPlaceholderRowClassName,
  activityActionClusterClassName,
  activityActionsClassName,
  activityBodyClassName,
  activityCellClassName,
  activityHeaderActivityClassName,
  activityHeaderGridClassName,
  activityIconButtonClassName,
  activityMainLineClassName,
  activityMetaClassName,
  activityMetaStatusClassName,
  activityMobileLineClassName,
  activityMobilePlaceInputClassName,
  activityMobileStatusClassName,
  activityPillClassName,
  activityPlaceInputClassName,
  activityPlaceLineClassName,
  activityRouteLabelClassName,
  activityRouteLineClassName,
  activitySentenceClassName,
  activityTimeRailClassName,
  activityTitleInputClassName,
  activityTypePickerClassName,
  activityTypeRailClassName,
  activityMobileTypePickerClassName,
  subActivityModalCloseClassName,
  subActivityToggleButtonClassName,
  ticketFieldClassName,
  ticketModalBackdropClassName,
  ticketModalBodyClassName,
  ticketModalClassName,
  ticketModalFooterClassName,
  ticketModalHeaderClassName,
  ticketModalTitleClassName,
  activityTabletActionsClassName,
  activityTabletActionLayerClassName,
} from "../smart-itinerary-table.styles";

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
      <button
        type="button"
        className={subActivityToggleButtonClassName}
        aria-label={`Sub-activities for ${item.activity}`}
        aria-expanded={subActivitiesExpanded}
        title={`Sub-activities for ${item.activity}`}
        onClick={(event) => {
          event.stopPropagation();
          if (compact) {
            setActionsExpanded(false);
          }
          if (
            typeof window !== "undefined" &&
            typeof window.matchMedia === "function" &&
            window.matchMedia("(max-width: 640px)").matches
          ) {
            setSubActivityModalOpen(true);
            return;
          }
          setSubActivitiesExpanded((current) => !current);
        }}
      >
        <Icon name="list" />
      </button>
    ) : null;
  const renderActivityActions = (compact = false) => (
    <>
      {item.mapLink ? (
        <a
          className={activityIconButtonClassName}
          href={item.mapLink}
          target="_blank"
          rel="noreferrer"
          aria-label={`${itineraryLabels.row.mapFallback}: ${item.place || item.activity}`}
          title={`${itineraryLabels.row.mapFallback}: ${item.place || item.activity}`}
          onClick={(event) => {
            event.stopPropagation();
            if (compact) {
              setActionsExpanded(false);
            }
          }}
        >
          <Icon name="map" />
        </a>
      ) : null}
      {onAddNoteForItem ? (
        <button
          type="button"
          className={activityIconButtonClassName}
          aria-label={locale === "th" ? `เพิ่มโน้ต ${item.activity}` : `Add note for ${item.activity}`}
          title={locale === "th" ? `เพิ่มโน้ต ${item.activity}` : `Add note for ${item.activity}`}
          onClick={(event) => {
            event.stopPropagation();
            openNoteModal(item, compact);
          }}
        >
          <Icon name="note" />
        </button>
      ) : null}
      <button
        type="button"
        className={activityIconButtonClassName}
        aria-label={itineraryLabels.row.openDetails({
          activity: item.activity,
        })}
        title={itineraryLabels.row.openDetails({
          activity: item.activity,
        })}
        onClick={(event) => {
          event.stopPropagation();
          if (compact) {
            setActionsExpanded(false);
          }
          onOpenItemDetails(item.id);
        }}
      >
        <Icon name="panel" />
      </button>
      {onEditItem ? (
        <button
          type="button"
          className={activityIconButtonClassName}
          aria-label={itineraryLabels.row.edit({
            activity: item.activity,
          })}
          title={itineraryLabels.row.edit({
            activity: item.activity,
          })}
          onClick={(event) => {
            event.stopPropagation();
            if (compact) {
              setActionsExpanded(false);
            }
            onEditItem(item.id);
          }}
        >
          <Icon name="edit" />
        </button>
      ) : null}
      {onDeleteItem ? (
        <button
          type="button"
          className={activityIconButtonClassName}
          aria-label={itineraryLabels.row.delete({
            activity: item.activity,
          })}
          title={itineraryLabels.row.delete({
            activity: item.activity,
          })}
          onClick={(event) => {
            event.stopPropagation();
            if (compact) {
              setActionsExpanded(false);
            }
            onDeleteItem(item.id);
          }}
        >
          <Icon name="trash" />
        </button>
      ) : null}
    </>
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
            <button
              type="button"
              className={activityTabletActionsClassName}
              aria-label={actionMenuLabel}
              aria-expanded={actionsExpanded}
              title={actionMenuLabel}
              onClick={(event) => {
                event.stopPropagation();
                setActionsExpanded((current) => !current);
              }}
            >
              <Icon name="dots" />
            </button>
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
            <button
              type="button"
              className={activityTabletActionsClassName}
              aria-label={actionMenuLabel}
              aria-expanded={actionsExpanded}
              title={actionMenuLabel}
              onClick={(event) => {
                event.stopPropagation();
                setActionsExpanded((current) => !current);
              }}
            >
              <Icon name="dots" />
            </button>
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

export function ItineraryNoteModal({
  item,
  locale,
  onClose,
  onSave,
}: {
  item: ItineraryItem;
  locale: Locale;
  onClose: () => void;
  onSave: (body: string) => void | Promise<void>;
}) {
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const title = locale === "th" ? `โน้ตสำหรับ ${item.activity}` : `Note for ${item.activity}`;
  const subtitle = locale === "th" ? "เก็บรายละเอียดสั้น ๆ ที่เกี่ยวกับ activity นี้" : "Capture a short note tied to this activity.";
  const placeholder = locale === "th" ? "เช่น นัดเจอกันที่ทางออก A, เตรียมพาสปอร์ต" : "Example: Meet at exit A, keep passports ready";

  useEscapeToClose(onClose);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    try {
      await onSave(trimmed);
    } finally {
      setSaving(false);
    }
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={ticketModalBackdropClassName}
      role="presentation"
      onClick={onClose}
    >
      <form
        className={cn(ticketModalClassName, "max-w-[480px]")}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => void submit(event)}
      >
        <header className={ticketModalHeaderClassName}>
          <strong className={ticketModalTitleClassName}>
            <span>{title}</span>
            <small>{subtitle}</small>
          </strong>
          <button
            type="button"
            className={subActivityModalCloseClassName}
            aria-label={locale === "th" ? "ปิด modal โน้ต" : "Close note modal"}
            onClick={onClose}
          >
            <Icon name="x" />
          </button>
        </header>
        <div className={ticketModalBodyClassName}>
          <label className={cn(ticketFieldClassName, "col-span-full")}>
            <span>{locale === "th" ? "โน้ต" : "Note"}</span>
            <textarea
              autoFocus
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder={placeholder}
            />
          </label>
        </div>
        <footer className={ticketModalFooterClassName}>
          <button
            type="button"
            className="inline-flex min-h-9 items-center justify-center rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-3 text-xs font-extrabold text-(--color-text-muted) hover:bg-(--color-surface-subtle) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus)"
            onClick={onClose}
          >
            {locale === "th" ? "ยกเลิก" : "Cancel"}
          </button>
          <button
            type="submit"
            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-(--radius-sm) border border-(--color-primary-border) bg-(--color-primary) px-3 text-xs font-extrabold text-white hover:bg-(--color-primary-strong) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus) disabled:cursor-not-allowed disabled:opacity-50"
            disabled={saving || !body.trim()}
          >
            <Icon name="note" />
            {locale === "th" ? "บันทึกโน้ต" : "Save note"}
          </button>
        </footer>
      </form>
    </div>,
    document.body,
  );
}

export { InlineActivityField } from "./activity-cell/InlineActivityField";
export { ActivityTypePicker } from "./activity-cell/ActivityTypePicker";
export { ActivityLocationLine } from "./activity-cell/ActivityLocationLine";

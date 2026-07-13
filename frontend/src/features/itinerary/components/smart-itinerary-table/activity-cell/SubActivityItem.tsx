import { cn } from "@/src/lib/cn";
import { ActivityActionButtons } from "./ActivityActionButtons";
import { ActivityLocationLine } from "./ActivityLocationLine";
import { ActivityTimeButton } from "./ActivityTimeButton";
import { ActivityTypePicker } from "./ActivityTypePicker";
import { InlineActivityField } from "./InlineActivityField";
import { ItineraryBookingButton } from "./ItineraryBookingButton";
import {
  activityMobileTypePickerClassName,
  subActivityActionsClassName,
  subActivityLineClassName,
  subActivityTextClassName,
  subActivityTitleInputClassName,
} from "../smart-itinerary-table.styles";
import type { SubActivitySharedProps } from "./sub-activity.types";

interface SubActivityItemProps
  extends Pick<
    SubActivitySharedProps,
    | "bookingDocs"
    | "bookingLinkItems"
    | "itineraryLabels"
    | "locale"
    | "onAddBookingForItem"
    | "onAddNoteForItem"
    | "onOpenNoteForItem"
    | "onSaveBookingForItem"
    | "onUnlinkBookingForItem"
    | "onDeleteItem"
    | "onEditItem"
    | "onUpdateItemInline"
  > {
  editable: boolean;
  subItem: SubActivitySharedProps["item"];
}

export function SubActivityItem({
  bookingDocs,
  bookingLinkItems,
  editable,
  itineraryLabels,
  locale,
  onAddBookingForItem,
  onAddNoteForItem,
  onDeleteItem,
  onEditItem,
  onOpenNoteForItem,
  onSaveBookingForItem,
  onUnlinkBookingForItem,
  onUpdateItemInline,
  subItem,
}: SubActivityItemProps) {
  return (
    <div
      className={cn(subActivityLineClassName, subActivityTextClassName)}
      data-sub-item-id={subItem.id}
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
          bookingDocs={bookingDocs}
          bookingLinkItems={bookingLinkItems}
          item={subItem}
          itineraryLabels={itineraryLabels}
          locale={locale}
          onAddBookingForItem={onAddBookingForItem}
          onSaveBookingForItem={onSaveBookingForItem}
          onUnlinkBookingForItem={onUnlinkBookingForItem}
        />
        <ActivityTypePicker
          buttonClassName={cn(
            activityMobileTypePickerClassName,
            "!inline-flex !w-7 max-[520px]:!inline-flex",
          )}
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
          onToggleActivityBlock={
            onUpdateItemInline
              ? (itemId) => onUpdateItemInline(itemId, { isPlanBlock: !subItem.isPlanBlock })
              : undefined
          }
          showDetails={false}
          showMap={false}
        />
      </div>
    </div>
  );
}

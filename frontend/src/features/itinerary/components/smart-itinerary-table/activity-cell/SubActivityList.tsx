import { cn } from "@/src/lib/cn";
import { Icon } from "@/src/ui/icons";
import { ActivityLocationLine } from "./ActivityLocationLine";
import { ActivityTypePicker } from "./ActivityTypePicker";
import { InlineActivityField } from "./InlineActivityField";
import { ItineraryBookingButton } from "./BookingComponents";
import { ActivityTimeButton } from "./ActivityTimeButton";
import { ActivityActionButtons } from "./ActivityActionButtons";
import {
  addSubActivityButtonClassName,
  activityMobileTypePickerClassName,
  subActivityActionsClassName,
  subActivityLineClassName,
  subActivityListClassName,
  subActivityModalListClassName,
  subActivityTextClassName,
  subActivityTitleInputClassName,
} from "../smart-itinerary-table.styles";
import type { SubActivityListProps } from "./sub-activity.types";

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
}: SubActivityListProps) {
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

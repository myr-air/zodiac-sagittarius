import {
  subActivityModalBackdropClassName,
  subActivityModalBodyClassName,
  subActivityModalClassName,
  subActivityModalHeaderClassName,
  subActivityModalTitleClassName,
} from "../smart-itinerary-table.styles";
import { ActivityCellModalHeader } from "./ActivityCellModalHeader";
import { ActivityCellModalPortal } from "./ActivityCellModalPortal";
import { SubActivityList } from "./SubActivityList";
import type { SubActivityModalProps } from "./sub-activity.types";

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
}: SubActivityModalProps) {
  return (
    <ActivityCellModalPortal
      backdropClassName={subActivityModalBackdropClassName}
      onClose={onClose}
    >
      <section
        className={subActivityModalClassName}
        role="dialog"
        aria-modal="true"
        aria-label={`Sub-activities for ${item.activity}`}
        onClick={(event) => event.stopPropagation()}
      >
        <ActivityCellModalHeader
          closeLabel="Close sub-activities"
          headerClassName={subActivityModalHeaderClassName}
          onClose={onClose}
          subtitle={itineraryLabels.row.subItemQuick}
          title={item.activity}
          titleClassName={subActivityModalTitleClassName}
        />
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
    </ActivityCellModalPortal>
  );
}

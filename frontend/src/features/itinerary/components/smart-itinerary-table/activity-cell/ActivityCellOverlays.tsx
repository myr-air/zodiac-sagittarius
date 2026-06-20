import { ItineraryNoteModal } from "./ItineraryNoteModal";
import { SubActivityList } from "./SubActivityList";
import { SubActivityModal } from "./SubActivityModal";
import type { ActivityCellProps } from "./activity-cell.types";
import type { ItineraryItem } from "@/src/trip/types";

interface ActivityCellOverlaysProps
  extends Pick<
    ActivityCellProps,
    | "bookingDocs"
    | "bookingLinkItems"
    | "canEdit"
    | "itineraryLabels"
    | "item"
    | "locale"
    | "onAddBookingForItem"
    | "onAddNoteForItem"
    | "onAddSubActivity"
    | "onDeleteItem"
    | "onEditItem"
    | "onSaveBookingForItem"
    | "onUnlinkBookingForItem"
    | "onUpdateItemInline"
    | "selected"
    | "subItems"
  > {
  noteTarget: ItineraryItem | null;
  onCloseNote: () => void;
  onCloseSubActivityModal: () => void;
  onOpenNoteForItem: (item: ItineraryItem) => void;
  subActivitiesExpanded: boolean;
  subActivityModalOpen: boolean;
}

export function ActivityCellOverlays({
  bookingDocs,
  bookingLinkItems,
  canEdit,
  item,
  itineraryLabels,
  locale,
  noteTarget,
  onAddBookingForItem,
  onAddNoteForItem,
  onAddSubActivity,
  onCloseNote,
  onCloseSubActivityModal,
  onDeleteItem,
  onEditItem,
  onOpenNoteForItem,
  onSaveBookingForItem,
  onUnlinkBookingForItem,
  onUpdateItemInline,
  selected,
  subActivitiesExpanded,
  subActivityModalOpen,
  subItems,
}: ActivityCellOverlaysProps) {
  return (
    <>
      {subActivityModalOpen ? (
        <SubActivityModal
          canEdit={canEdit}
          item={item}
          itineraryLabels={itineraryLabels}
          locale={locale}
          subItems={subItems}
          onAddSubActivity={onAddSubActivity}
          onAddNoteForItem={onAddNoteForItem}
          onOpenNoteForItem={onOpenNoteForItem}
          onClose={onCloseSubActivityModal}
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
      <SubActivityList
        canEdit={canEdit}
        item={item}
        itineraryLabels={itineraryLabels}
        locale={locale}
        selected={selected}
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
        visible={subActivitiesExpanded || (selected && subItems.length === 0)}
      />
      {noteTarget && onAddNoteForItem ? (
        <ItineraryNoteModal
          item={noteTarget}
          locale={locale}
          onClose={onCloseNote}
          onSave={async (body) => {
            await onAddNoteForItem(noteTarget.id, body);
            onCloseNote();
          }}
        />
      ) : null}
    </>
  );
}

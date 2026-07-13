import { ActivityActionButtons } from "./ActivityActionButtons";
import type { ActivityCellProps } from "./activity-cell.types";

interface ActivityCellActionGroupProps
  extends Pick<
    ActivityCellProps,
    | "item"
    | "itineraryLabels"
    | "locale"
    | "onAddNoteForItem"
    | "onDeleteItem"
    | "onEditItem"
    | "onOpenItemDetails"
    | "onUpdateItemInline"
  > {
  compact?: boolean;
  onCompactActionComplete?: () => void;
  onOpenNoteForItem: (target: ActivityCellProps["item"], compact?: boolean) => void;
}

export function ActivityCellActionGroup({
  compact = false,
  item,
  itineraryLabels,
  locale,
  onAddNoteForItem,
  onCompactActionComplete,
  onDeleteItem,
  onEditItem,
  onOpenItemDetails,
  onOpenNoteForItem,
  onUpdateItemInline,
}: ActivityCellActionGroupProps) {
  return (
    <ActivityActionButtons
      item={item}
      itineraryLabels={itineraryLabels}
      locale={locale}
      onActionComplete={compact ? onCompactActionComplete : undefined}
      onDeleteItem={onDeleteItem}
      onEditItem={onEditItem}
      onOpenItemDetails={onOpenItemDetails}
      onOpenNoteForItem={
        onAddNoteForItem
          ? (target) => onOpenNoteForItem(target, compact)
          : undefined
      }
      onToggleActivityBlock={onUpdateItemInline ? (itemId) => onUpdateItemInline(itemId, { isPlanBlock: !item.isPlanBlock }) : undefined}
    />
  );
}

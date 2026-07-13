import { Fragment, useMemo } from "react";
import type { ItineraryItem } from "@/src/trip/types";
import { Icon } from "@/src/ui/icons";
import { ActivityCell } from "./activity-cell/ActivityCell";
import type { DayGroupProps } from "./day-group.types";
import {
  addStopInlineButtonClassName,
  addStopRowClassName,
  itemPlaceholderCellClassName,
  itemPlaceholderRowClassName,
  planVariantGroupItemRowClassName,
  planVariantGroupLabelRowClassName,
} from "./smart-itinerary-table.styles";

interface DayGroupActivityRowsProps
  extends Pick<
    DayGroupProps,
    | "bookingDocs"
    | "bookingLinkItems"
    | "canEdit"
    | "itineraryLabels"
    | "locale"
    | "onAddBookingForItem"
    | "onAddNoteForItem"
    | "onAddStop"
    | "onAddSubActivity"
    | "onDeleteItem"
    | "onEditItem"
    | "onOpenItemDetails"
    | "onSaveBookingForItem"
    | "onSelectItem"
    | "onUnlinkBookingForItem"
    | "onUpdateItemInline"
    | "selectedItemId"
    | "contextRailOpen"
  > {
  childItemsByParentId: Map<string, ItineraryItem[]>;
  day: string;
  showGraph: boolean;
  visibleItems: ItineraryItem[];
}

interface PlanVariantGroup {
  pathId: string;
  pathName: string;
  items: ItineraryItem[];
}

function groupItemsByPath(items: ItineraryItem[]): PlanVariantGroup[] {
  const mainItems: ItineraryItem[] = [];
  const groups = new Map<string, PlanVariantGroup>();

  for (const item of items) {
    const pathId = item.pathId;
    if (!pathId) {
      mainItems.push(item);
      continue;
    }
    let group = groups.get(pathId);
    if (!group) {
      group = { pathId, pathName: item.pathName ?? "", items: [] };
      groups.set(pathId, group);
    }
    if (!group.pathName && item.pathName) group.pathName = item.pathName;
    group.items.push(item);
  }

  const result: PlanVariantGroup[] = [];
  if (mainItems.length > 0) {
    result.push({ pathId: "", pathName: "", items: mainItems });
  }
  for (const group of groups.values()) {
    result.push(group);
  }
  return result;
}

function renderActivityRow(
  item: ItineraryItem,
  contextRailOpen: boolean | undefined,
  selectedItemId: string,
  isPlanVariant: boolean,
  props: Pick<
    DayGroupActivityRowsProps,
    | "bookingDocs"
    | "bookingLinkItems"
    | "canEdit"
    | "itineraryLabels"
    | "locale"
    | "onAddBookingForItem"
    | "onAddNoteForItem"
    | "onAddSubActivity"
    | "onDeleteItem"
    | "onEditItem"
    | "onOpenItemDetails"
    | "onSaveBookingForItem"
    | "onSelectItem"
    | "onUnlinkBookingForItem"
    | "onUpdateItemInline"
  > & { childItemsByParentId: Map<string, ItineraryItem[]> },
) {
  const rowClassName = isPlanVariant
    ? planVariantGroupItemRowClassName
    : itemPlaceholderRowClassName;

  return (
    <tr
      aria-label={props.itineraryLabels.row.openDetails({
        activity: item.activity,
      })}
      className={rowClassName}
      data-item-id={item.id}
      data-hierarchy-level={1}
      key={item.id}
    >
      <td className={itemPlaceholderCellClassName}>
        <ActivityCell
          bookingDocs={props.bookingDocs}
          bookingLinkItems={props.bookingLinkItems}
          canEdit={props.canEdit}
          item={item}
          itineraryLabels={props.itineraryLabels}
          locale={props.locale}
          selected={selectedItemId === item.id}
          subItems={props.childItemsByParentId.get(item.id) ?? []}
          onAddBookingForItem={props.onAddBookingForItem}
          onAddNoteForItem={props.onAddNoteForItem}
          onAddSubActivity={props.onAddSubActivity}
          onDeleteItem={props.onDeleteItem}
          onEditItem={props.onEditItem}
          onOpenItemDetails={props.onOpenItemDetails}
          onSaveBookingForItem={props.onSaveBookingForItem}
          onSelectItem={props.onSelectItem}
          onUnlinkBookingForItem={props.onUnlinkBookingForItem}
          onUpdateItemInline={props.onUpdateItemInline}
          contextRailOpen={contextRailOpen}
        />
      </td>
    </tr>
  );
}

export function DayGroupActivityRows({
  bookingDocs,
  bookingLinkItems,
  canEdit,
  childItemsByParentId,
  day,
  itineraryLabels,
  locale,
  onAddBookingForItem,
  onAddNoteForItem,
  onAddStop,
  onAddSubActivity,
  onDeleteItem,
  onEditItem,
  onOpenItemDetails,
  onSaveBookingForItem,
  onSelectItem,
  onUnlinkBookingForItem,
  onUpdateItemInline,
  selectedItemId,
  contextRailOpen,
  showGraph,
  visibleItems,
}: DayGroupActivityRowsProps) {
  const planVariantGroups = useMemo(
    () => groupItemsByPath(visibleItems),
    [visibleItems],
  );

  return (
    <>
      {planVariantGroups.map((group) => {
        const isPlanVariant = group.pathId !== "";

        return (
          <Fragment key={group.pathId || "__main__"}>
            {isPlanVariant ? (
              <tr className={planVariantGroupLabelRowClassName} aria-hidden="true">
                <td colSpan={showGraph ? 2 : 1}>{group.pathName}</td>
              </tr>
            ) : null}
            {group.items.map((item) =>
              renderActivityRow(
                item,
                contextRailOpen,
                selectedItemId,
                isPlanVariant,
                {
                  bookingDocs,
                  bookingLinkItems,
                  canEdit,
                  childItemsByParentId,
                  itineraryLabels,
                  locale,
                  onAddBookingForItem,
                  onAddNoteForItem,
                  onAddSubActivity,
                  onDeleteItem,
                  onEditItem,
                  onOpenItemDetails,
                  onSaveBookingForItem,
                  onSelectItem,
                  onUnlinkBookingForItem,
                  onUpdateItemInline,
                },
              ),
            )}
          </Fragment>
        );
      })}
      <tr className={addStopRowClassName} data-day-drop={day}>
        <td colSpan={showGraph ? 1 : 2}>
          {canEdit && onAddStop ? (
            <button
              type="button"
              className={addStopInlineButtonClassName}
              onClick={() => onAddStop(day)}
            >
              <Icon name="plus" />
              <span>{itineraryLabels.addStop}</span>
            </button>
          ) : null}
        </td>
      </tr>
    </>
  );
}

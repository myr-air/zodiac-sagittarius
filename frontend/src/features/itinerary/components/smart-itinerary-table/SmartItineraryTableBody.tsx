import type { BookingDoc, ItineraryItem, TripDailyBriefing } from "@/src/trip/types";
import type { ItineraryDayGroup } from "@/src/trip/itinerary-core";
import type { ItineraryPathOption } from "@/src/trip/itinerary-paths";
import type { Messages } from "@/src/i18n/messages";
import type { Locale } from "@/src/i18n/types";
import type { CSSProperties } from "react";
import { DayGroup } from "./day-group";
import { SmartItineraryTableHead } from "./SmartItineraryTableHead";
import type {
  ItineraryAsyncVoidResult,
  ItineraryBookingActionProps,
  ItineraryInlineItemEditProps,
  ItineraryItemInteractionProps,
  ItineraryNestedActivityActionProps,
} from "./itinerary-action.types";
import { smartTableClassName } from "./smart-itinerary-table.styles";

export interface SmartItineraryTableBodyProps
  extends ItineraryBookingActionProps,
    ItineraryInlineItemEditProps,
    ItineraryItemInteractionProps,
    ItineraryNestedActivityActionProps {
  collapsedDays: string[];
  groups: ItineraryDayGroup[];
  graphItemsByDay: Map<string, ItineraryItem[]>;
  dailyBriefingsByDate: Map<string, TripDailyBriefing>;
  pathOptions: ItineraryPathOption[];
  dayPathOverrides: Record<string, string | undefined>;
  showAllPaths: boolean;
  smartTableStyle: CSSProperties;
  graphColumnWidth: number;
  itineraryLabels: Messages["itinerary"];
  locale: Locale;
  startDate: string;
  selectedItemId: string;
  bookingDocs: BookingDoc[];
  bookingLinkItems: ItineraryItem[];
  canRestructureItems: boolean;
  onAddStop: (day?: string) => void;
  onMoveItemToPath?: (itemId: string, pathId: string) => void;
  onSaveDayTitle?: (date: string, version: number, title: string | null) => ItineraryAsyncVoidResult;
  onToggleDay: (day: string) => void;
  onChangeDayPath?: (day: string, pathId: string) => void;
  onClearDayPath?: (day: string) => void;
  tHeaders: Messages["itinerary"]["headers"];
}

export function SmartItineraryTableBody({
  collapsedDays,
  groups,
  graphItemsByDay,
  dailyBriefingsByDate,
  pathOptions,
  dayPathOverrides,
  showAllPaths,
  smartTableStyle,
  graphColumnWidth,
  itineraryLabels,
  locale,
  startDate,
  selectedItemId,
  bookingDocs,
  bookingLinkItems,
  canRestructureItems,
  onAddStop,
  onAddSubActivity,
  onAddNoteForItem,
  onAddBookingForItem,
  onSaveBookingForItem,
  onUnlinkBookingForItem,
  onDeleteItem,
  onEditItem,
  onMoveItemToPath,
  onOpenItemDetails,
  onSelectItem,
  onSaveDayTitle,
  onUpdateItemInline,
  onToggleDay,
  onChangeDayPath,
  onClearDayPath,
  tHeaders,
}: SmartItineraryTableBodyProps) {
  return (
    <table className={smartTableClassName} style={smartTableStyle}>
      <caption className="sr-only">{itineraryLabels.caption}</caption>
      <colgroup>
        <col style={{ width: graphColumnWidth }} />
        <col />
      </colgroup>
      <SmartItineraryTableHead labels={tHeaders} />
      {groups.map((group: ItineraryDayGroup, groupIndex: number) => (
        <DayGroup
          canEdit={canRestructureItems}
          collapsed={collapsedDays.includes(group.day)}
          graphColumnWidth={graphColumnWidth}
          graphItems={graphItemsByDay.get(group.day) ?? []}
          group={group}
          hasTopSpacer={groupIndex > 0}
          itineraryLabels={itineraryLabels}
          locale={locale}
          key={group.day}
          dailyBriefing={dailyBriefingsByDate.get(group.day) ?? null}
          selectedItemId={selectedItemId}
          startDate={startDate}
          pathOptions={pathOptions}
          dayPathOverride={dayPathOverrides[group.day]}
          showAllPaths={showAllPaths}
          onChangeDayPath={onChangeDayPath}
          onClearDayPath={onClearDayPath}
          onAddStop={onAddStop}
          onAddSubActivity={onAddSubActivity}
          onAddNoteForItem={onAddNoteForItem}
          onAddBookingForItem={onAddBookingForItem}
          onSaveBookingForItem={onSaveBookingForItem}
          onUnlinkBookingForItem={onUnlinkBookingForItem}
          bookingDocs={bookingDocs}
          bookingLinkItems={bookingLinkItems}
          onDeleteItem={onDeleteItem}
          onEditItem={onEditItem}
          onMoveItemToPath={onMoveItemToPath}
          onOpenItemDetails={onOpenItemDetails}
          onSelectItem={onSelectItem}
          onSaveDayTitle={onSaveDayTitle}
          onUpdateItemInline={onUpdateItemInline}
          onToggleDay={onToggleDay}
        />
      ))}
    </table>
  );
}

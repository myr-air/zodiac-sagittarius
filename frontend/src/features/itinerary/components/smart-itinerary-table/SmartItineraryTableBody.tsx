import type { BookingDoc, ItineraryItem, TripDailyBriefing } from "@/src/trip/types";
import type { ItineraryDayGroup } from "@/src/trip/itinerary-core";
import type { ItineraryPathOption } from "@/src/trip/itinerary-paths";
import type { Messages } from "@/src/i18n/messages";
import type { Locale } from "@/src/i18n/types";
import type { InlineItineraryItemPatch } from "../../lib";
import type {
  ItineraryBookingTemplate,
  ItineraryBookingTicketInput,
} from "@/src/trip/booking-docs";
import type { CSSProperties } from "react";
import { DayGroup } from "./day-group";
import { SmartItineraryTableHead } from "./SmartItineraryTableHead";
import { smartTableClassName } from "./smart-itinerary-table.styles";

interface SmartItineraryTableBodyProps {
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
  onMoveItemToPath?: (itemId: string, pathId: string) => void;
  onOpenItemDetails: (itemId: string) => void;
  onSelectItem: (itemId: string) => void;
  onSaveDayTitle?: (date: string, version: number, title: string | null) => void | Promise<void>;
  onUpdateItemInline?: (
    itemId: string,
    patch: InlineItineraryItemPatch,
  ) => void | Promise<void>;
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

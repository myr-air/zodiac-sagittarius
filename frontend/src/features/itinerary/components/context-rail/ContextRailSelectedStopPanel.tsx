import { Button } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import { useI18n } from "@/src/i18n/I18nProvider";
import { safeExternalHref } from "@/src/trip/safe-links";
import { activityTypeLabel, formatDuration, formatEndTime } from "@/src/features/itinerary/lib";
import type {
  BookingDoc,
  BookingDocType,
  Expense,
  ExpenseSummary,
  ItineraryItem,
  Member,
  StopNote,
  Suggestion,
  Trip,
  TripTask,
} from "@/src/trip/types";
import { ContextRailBookingSection } from "./ContextRailBookingSection";
import { ContextRailExpensesSection } from "./ContextRailExpensesSection";
import { ContextRailNotesSection } from "./ContextRailNotesSection";
import { ContextRailSuggestionsSection } from "./ContextRailSuggestionsSection";
import { ContextRailTab } from "./context-rail.utils";
import {
  conflictRowClassName,
  conflictSummaryClassName,
  detailButtonClassName,
  detailHeadingClassName,
  detailMapClassName,
  detailMetaLineClassName,
  detailSectionClassName,
  mapLinkClassName,
  mapMarkerClassName,
  mapPoiClassName,
  mapRoadBaseClassName,
  mapRoadOneClassName,
  mapRoadThreeClassName,
  mapRoadTwoClassName,
  mapWaterClassName,
  inspectorCloseButtonClassName,
  inspectorTabClassName,
  inspectorTabsClassName,
  inspectorTitleClassName,
  inspectorTitleHeadingClassName,
  railInspectorClassName,
} from "./context-rail.styles";

interface ContextRailSelectedStopPanelProps {
  selectedItem: ItineraryItem;
  currentMember: Member;
  trip: Trip;
  selectedAdvisories: NonNullable<ItineraryItem["advisories"]>;
  selectedNotes: StopNote[];
  selectedExpenses: Expense[];
  selectedTasks: TripTask[];
  selectedBookingDocs: BookingDoc[];
  selectedSuggestions: Suggestion[];
  expenseSummary: ExpenseSummary;
  canEdit: boolean;
  canCreateNote: boolean;
  canCreateSuggestion: boolean;
  canReviewSuggestions: boolean;
  canEditExpenses: boolean;
  activeTab: ContextRailTab;
  onActiveTabChange: (tab: ContextRailTab) => void;
  onClose: () => void;
  onEditSelected: () => void;
  onSuggestSelected: () => void;
  onToggleTaskStatus: (taskId: string) => void;
  onChangeBookingDocType?: (
    bookingDocId: string,
    type: BookingDocType,
  ) => void | Promise<void>;
  onChangeBookingDocQuickFields?: (
    bookingDocId: string,
    patch: {
      confirmationCode?: string | null;
      providerName?: string | null;
    },
  ) => void | Promise<void>;
  onCreateNote: (input: { itemId: string; body: string }) => void;
  onCreateExpense: (input: {
    itemId: string | null;
    title: string;
    amount: number;
    paidBy: string;
    category: Expense["category"];
  }) => void;
  onUpdateExpense: (input: {
    expenseId: string;
    title: string;
    amount: number;
    paidBy: string;
    category: Expense["category"];
  }) => void;
  onDeleteExpense: (expenseId: string) => void;
  onDeleteNote: (noteId: string) => void;
  onUpdateNote: (input: { noteId: string; body: string }) => void;
  onReviewSuggestion: (
    suggestionId: string,
    decision: "approved" | "rejected",
  ) => void;
}

export function ContextRailSelectedStopPanel({
  selectedItem,
  trip,
  selectedAdvisories,
  selectedNotes,
  selectedExpenses,
  selectedTasks,
  selectedBookingDocs,
  selectedSuggestions,
  expenseSummary,
  canEdit,
  canCreateNote,
  canCreateSuggestion,
  canReviewSuggestions,
  canEditExpenses,
  activeTab,
  onActiveTabChange,
  onClose,
  onEditSelected,
  onSuggestSelected,
  onToggleTaskStatus,
  onChangeBookingDocType,
  onChangeBookingDocQuickFields,
  onCreateNote,
  onCreateExpense,
  onUpdateExpense,
  onDeleteExpense,
  onDeleteNote,
  onUpdateNote,
  onReviewSuggestion,
  currentMember,
}: ContextRailSelectedStopPanelProps) {
  const { locale, t } = useI18n();
  const selectedEnd = formatEndTime(selectedItem.startTime, selectedItem.durationMinutes);
  const groupSpend = expenseSummary.groupSpend.toLocaleString("en-HK");
  const perPerson = Math.round(
    expenseSummary.groupSpend / Math.max(1, trip.members.length - 1),
  ).toLocaleString("en-HK");

  return (
    <div className={railInspectorClassName}>
      <div className={inspectorTitleClassName}>
        <h2 className={inspectorTitleHeadingClassName}>
          {selectedItem.activity}
        </h2>
        <button
          className={inspectorCloseButtonClassName}
          type="button"
          aria-label={t.contextRail.closeDetails}
          onClick={onClose}
        >
          <Icon name="chevronRight" />
        </button>
      </div>

      <div
        className={inspectorTabsClassName}
        role="tablist"
        aria-label={t.contextRail.tabsLabel}
      >
        <button
          className={inspectorTabClassName}
          type="button"
          role="tab"
          aria-selected={activeTab === "notes"}
          onClick={() => onActiveTabChange("notes")}
        >
          {t.contextRail.tabs.notes}
        </button>
        <button
          className={inspectorTabClassName}
          type="button"
          role="tab"
          aria-selected={activeTab === "booking"}
          onClick={() => onActiveTabChange("booking")}
        >
          {t.contextRail.tabs.booking}
        </button>
        <button
          className={inspectorTabClassName}
          type="button"
          role="tab"
          aria-selected={activeTab === "suggestions"}
          onClick={() => onActiveTabChange("suggestions")}
        >
          {t.contextRail.tabs.suggestions}
        </button>
      </div>

      <section
        className={detailSectionClassName}
        aria-label={t.contextRail.detailLabel}
      >
        <p className={detailMetaLineClassName}>
          <Icon name="utensils" />{" "}
          {activityTypeLabel(selectedItem.activityType, locale)}
        </p>
        <p className={detailMetaLineClassName}>
          <Icon name="clock" /> {selectedItem.startTime} – {selectedEnd} (
          {formatDuration(selectedItem.durationMinutes, locale)})
        </p>
        <p className={detailMetaLineClassName}>
          <Icon name="location" /> {selectedItem.address ?? selectedItem.place}
        </p>
        <a
          className={mapLinkClassName}
          href={safeExternalHref(selectedItem.mapLink) || "#"}
        >
          {t.contextRail.openMaps}
        </a>
        <div
          className={detailMapClassName}
          aria-label={t.contextRail.mapPreview}
        >
          <span className={`${mapRoadBaseClassName} ${mapRoadOneClassName}`} />
          <span className={`${mapRoadBaseClassName} ${mapRoadTwoClassName}`} />
          <span className={`${mapRoadBaseClassName} ${mapRoadThreeClassName}`} />
          <span className={mapWaterClassName} />
          <span className={`${mapPoiClassName} map-poi-1 left-[58px] top-[18px]`}>
            Austin
          </span>
          <span className={`${mapPoiClassName} map-poi-2 right-10 top-5`}>
            Jordan
          </span>
          <span className={mapMarkerClassName}>
            <Icon name="location" />
          </span>
        </div>
        {canEdit ? (
          <Button
            type="button"
            variant="secondary"
            className={detailButtonClassName}
            onClick={onEditSelected}
          >
            {t.contextRail.editDetails}
          </Button>
        ) : (
          <Button
            type="button"
            variant="secondary"
            className={detailButtonClassName}
            disabled={!canCreateSuggestion}
            onClick={() => {
              onSuggestSelected();
              onActiveTabChange("suggestions");
            }}
          >
            {t.contextRail.suggestEdit}
          </Button>
        )}
      </section>

      {activeTab === "notes" ? (
        <ContextRailNotesSection
          itemId={selectedItem.id}
          notes={selectedNotes}
          tripMembers={trip.members}
          currentMember={currentMember}
          canCreateNote={canCreateNote}
          canEdit={canEdit}
          onCreateNote={onCreateNote}
          onDeleteNote={onDeleteNote}
          onUpdateNote={onUpdateNote}
        />
      ) : null}

      {activeTab === "booking" ? (
        <ContextRailBookingSection
          advisories={selectedAdvisories}
          bookingDocs={selectedBookingDocs}
          tasks={selectedTasks}
          canEdit={canEdit}
          onChangeBookingDocType={onChangeBookingDocType}
          onChangeBookingDocQuickFields={onChangeBookingDocQuickFields}
          onToggleTaskStatus={onToggleTaskStatus}
        />
      ) : null}

      {activeTab === "suggestions" ? (
        <ContextRailSuggestionsSection
          suggestions={selectedSuggestions}
          tripMembers={trip.members}
          canReviewSuggestions={canReviewSuggestions}
          onReviewSuggestion={onReviewSuggestion}
        />
      ) : null}

      <section
        className={`${detailSectionClassName} conflict-section`}
        aria-label={t.contextRail.conflicts.label}
      >
        <h3 className={detailHeadingClassName}>
          {t.contextRail.conflicts.title}
        </h3>
        <div className={conflictRowClassName}>
          <span className={conflictSummaryClassName}>
            <Icon name="alertCircle" />{" "}
            {t.contextRail.conflicts.peakWarning}
          </span>
          <Button
            type="button"
            variant="ghost"
            className="min-h-8 px-2.5 py-1 text-[11px]"
            disabled={!canReviewSuggestions}
          >
            {t.contextRail.conflicts.autoFix}
          </Button>
        </div>
      </section>

      <ContextRailExpensesSection
        selectedItemId={selectedItem.id}
        expenses={selectedExpenses}
        members={trip.members}
        perPerson={perPerson}
        groupSpend={groupSpend}
        canEditExpenses={canEditExpenses}
        onCreateExpense={onCreateExpense}
        onUpdateExpense={onUpdateExpense}
        onDeleteExpense={onDeleteExpense}
      />
    </div>
  );
}

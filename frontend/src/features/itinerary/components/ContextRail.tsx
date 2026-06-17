import { useEffect, useMemo, useState } from "react";
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
import { safeExternalHref } from "@/src/trip/safe-links";
import { useI18n } from "@/src/i18n/I18nProvider";
import { Button } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import { activityTypeLabel, formatDuration, formatEndTime } from "@/src/features/itinerary/lib";
import { ContextRailBookingSection } from "./context-rail/ContextRailBookingSection";
import { ContextRailExpensesSection } from "./context-rail/ContextRailExpensesSection";
import { ContextRailNotesSection } from "./context-rail/ContextRailNotesSection";
import { ContextRailSuggestionsSection } from "./context-rail/ContextRailSuggestionsSection";
import { ContextRailTab } from "./context-rail.utils";
import {
  conflictRowClassName,
  conflictSummaryClassName,
  contextRailClassName,
  contextRailClosedClassName,
  contextRailOpenClassName,
  detailButtonClassName,
  detailHeadingClassName,
  detailMapClassName,
  detailMetaLineClassName,
  detailSectionClassName,
  emptyWarningClassName,
  inspectorCloseButtonClassName,
  inspectorTabClassName,
  inspectorTabsClassName,
  inspectorTitleClassName,
  inspectorTitleHeadingClassName,
  mapLinkClassName,
  mapMarkerClassName,
  mapPoiClassName,
  mapRoadBaseClassName,
  mapRoadOneClassName,
  mapRoadThreeClassName,
  mapRoadTwoClassName,
  mapWaterClassName,
  railInspectorClassName,
} from "./context-rail.styles";

interface ContextRailProps {
  trip: Trip;
  selectedItem?: ItineraryItem;
  suggestions: Suggestion[];
  stopNotes: StopNote[];
  tasks: TripTask[];
  bookingDocs: BookingDoc[];
  currentMember: Member;
  expenseSummary: ExpenseSummary;
  canEdit: boolean;
  canCreateNote: boolean;
  canCreateSuggestion: boolean;
  canReviewSuggestions: boolean;
  canEditExpenses: boolean;
  open: boolean;
  preferredTab?: ContextRailTab;
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
  onEditSelected: () => void;
  onReviewSuggestion: (
    suggestionId: string,
    decision: "approved" | "rejected",
  ) => void;
  onSuggestSelected: () => void;
  onToggleTaskStatus: (taskId: string) => void;
  onUpdateNote: (input: { noteId: string; body: string }) => void;
  onClose: () => void;
}

export function ContextRail({
  trip,
  selectedItem,
  suggestions,
  stopNotes,
  tasks,
  bookingDocs,
  currentMember,
  expenseSummary,
  canEdit,
  canCreateNote,
  canCreateSuggestion,
  canReviewSuggestions,
  canEditExpenses,
  open,
  preferredTab = "notes",
  onChangeBookingDocType,
  onChangeBookingDocQuickFields,
  onCreateNote,
  onCreateExpense,
  onUpdateExpense,
  onDeleteExpense,
  onDeleteNote,
  onEditSelected,
  onReviewSuggestion,
  onSuggestSelected,
  onToggleTaskStatus,
  onUpdateNote,
  onClose,
}: ContextRailProps) {
  const { locale, t } = useI18n();
  const [activeTab, setActiveTab] = useState<ContextRailTab>(preferredTab);
  const selectedEnd = selectedItem
    ? formatEndTime(selectedItem.startTime, selectedItem.durationMinutes)
    : "";
  const groupSpend = expenseSummary.groupSpend.toLocaleString("en-HK");
  const perPerson = Math.round(
    expenseSummary.groupSpend / Math.max(1, trip.members.length - 1),
  ).toLocaleString("en-HK");
  /* v8 ignore next */
  const selectedAdvisories = selectedItem?.advisories ?? [];
  const selectedNotes = useMemo(() => {
    if (!selectedItem) return [];
    return stopNotes.filter((note) => note.itemId === selectedItem.id);
  }, [selectedItem, stopNotes]);
  const selectedExpenses = useMemo(() => {
    if (!selectedItem) return trip.expenses;
    return trip.expenses.filter(
      (expense) => expense.itineraryItemId === selectedItem.id,
    );
  }, [selectedItem, trip.expenses]);
  const selectedTasks = useMemo(() => {
    if (!selectedItem) return [];
    return tasks.filter(
      (task) =>
        task.relatedItemId === selectedItem.id ||
        (task.kind === "booking" &&
          task.title
            .toLowerCase()
            .includes(selectedItem.activity.toLowerCase())),
    );
  }, [selectedItem, tasks]);
  const selectedBookingDocs = useMemo(() => {
    if (!selectedItem) return [];
    return bookingDocs.filter((bookingDoc) =>
      bookingDoc.relatedItineraryItemIds.includes(selectedItem.id),
    );
  }, [bookingDocs, selectedItem]);
  const selectedSuggestions = useMemo(() => {
    if (!selectedItem) return [];
    return suggestions.filter(
      (suggestion) =>
        suggestion.targetItemId === selectedItem.id &&
        (suggestion.status === "pending" || suggestion.status === "conflicted"),
    );
  }, [selectedItem, suggestions]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setActiveTab(preferredTab);
    });
    return () => {
      cancelled = true;
    };
  }, [open, preferredTab, selectedItem?.id]);

  return (
    <aside
      className={`${contextRailClassName} ${open ? contextRailOpenClassName : contextRailClosedClassName}`}
      data-state={open ? "open" : "closed"}
      aria-hidden={open ? undefined : true}
      aria-label={t.contextRail.pageLabel}
      inert={open ? undefined : true}
    >
      <div className={railInspectorClassName}>
        <div className={inspectorTitleClassName}>
          <h2 className={inspectorTitleHeadingClassName}>
            {selectedItem
              ? selectedItem.activity
              : t.contextRail.expenses.title}
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

        {selectedItem ? (
          <>
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
                onClick={() => setActiveTab("notes")}
              >
                {t.contextRail.tabs.notes}
              </button>
              <button
                className={inspectorTabClassName}
                type="button"
                role="tab"
                aria-selected={activeTab === "booking"}
                onClick={() => setActiveTab("booking")}
              >
                {t.contextRail.tabs.booking}
              </button>
              <button
                className={inspectorTabClassName}
                type="button"
                role="tab"
                aria-selected={activeTab === "suggestions"}
                onClick={() => setActiveTab("suggestions")}
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
                <Icon name="location" />{" "}
                {selectedItem.address ?? selectedItem.place}
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
                <span
                  className={`${mapRoadBaseClassName} ${mapRoadOneClassName}`}
                />
                <span
                  className={`${mapRoadBaseClassName} ${mapRoadTwoClassName}`}
                />
                <span
                  className={`${mapRoadBaseClassName} ${mapRoadThreeClassName}`}
                />
                <span className={mapWaterClassName} />
                <span
                  className={`${mapPoiClassName} map-poi-1 left-[58px] top-[18px]`}
                >
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
                    setActiveTab("suggestions");
                  }}
                >
                  {t.contextRail.suggestEdit}
                </Button>
              )}
            </section>

            {activeTab === "notes" ? (
              <ContextRailNotesSection
                itemId={selectedItem?.id}
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
          </>
        ) : null}

        <ContextRailExpensesSection
          selectedItemId={selectedItem?.id}
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
    </aside>
  );
}

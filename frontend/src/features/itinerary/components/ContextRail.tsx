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
import { useI18n } from "@/src/i18n/I18nProvider";
import { Icon } from "@/src/ui/icons";
import { ContextRailExpensesSection } from "./context-rail/ContextRailExpensesSection";
import { ContextRailSelectedStopPanel } from "./context-rail/ContextRailSelectedStopPanel";
import { ContextRailTab } from "./context-rail/context-rail.utils";
import {
  contextRailClassName,
  contextRailClosedClassName,
  contextRailOpenClassName,
  inspectorCloseButtonClassName,
  inspectorTitleClassName,
  inspectorTitleHeadingClassName,
  railInspectorClassName,
} from "./context-rail/context-rail.styles";

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
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<ContextRailTab>(preferredTab);

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
      {selectedItem ? (
        <ContextRailSelectedStopPanel
          trip={trip}
          selectedItem={selectedItem}
          currentMember={currentMember}
          selectedAdvisories={selectedAdvisories}
          selectedNotes={selectedNotes}
          selectedExpenses={selectedExpenses}
          selectedTasks={selectedTasks}
          selectedBookingDocs={selectedBookingDocs}
          selectedSuggestions={selectedSuggestions}
          expenseSummary={expenseSummary}
          canEdit={canEdit}
          canCreateNote={canCreateNote}
          canCreateSuggestion={canCreateSuggestion}
          canReviewSuggestions={canReviewSuggestions}
          canEditExpenses={canEditExpenses}
          activeTab={activeTab}
          onActiveTabChange={setActiveTab}
          onClose={onClose}
          onEditSelected={onEditSelected}
          onSuggestSelected={onSuggestSelected}
          onToggleTaskStatus={onToggleTaskStatus}
          onChangeBookingDocType={onChangeBookingDocType}
          onChangeBookingDocQuickFields={onChangeBookingDocQuickFields}
          onCreateNote={onCreateNote}
          onCreateExpense={onCreateExpense}
          onUpdateExpense={onUpdateExpense}
          onDeleteExpense={onDeleteExpense}
          onDeleteNote={onDeleteNote}
          onUpdateNote={onUpdateNote}
          onReviewSuggestion={onReviewSuggestion}
        />
      ) : (
        <div className={railInspectorClassName}>
          <div className={inspectorTitleClassName}>
            <h2 className={inspectorTitleHeadingClassName}>
              {t.contextRail.expenses.title}
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
          <ContextRailExpensesSection
            selectedItemId={undefined}
            expenses={selectedExpenses}
            members={trip.members}
            perPerson={Math.round(
              expenseSummary.groupSpend / Math.max(1, trip.members.length - 1),
            ).toLocaleString("en-HK")}
            groupSpend={expenseSummary.groupSpend.toLocaleString("en-HK")}
            canEditExpenses={canEditExpenses}
            onCreateExpense={onCreateExpense}
            onUpdateExpense={onUpdateExpense}
            onDeleteExpense={onDeleteExpense}
          />
        </div>
      )}
    </aside>
  );
}

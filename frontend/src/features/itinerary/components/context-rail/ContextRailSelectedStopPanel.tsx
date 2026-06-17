import { Button } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import { useI18n } from "@/src/i18n/I18nProvider";
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
import { ContextRailStopDetailSection } from "./ContextRailStopDetailSection";
import { ContextRailTabs } from "./ContextRailTabs";
import { ContextRailTab } from "./context-rail.utils";
import {
  conflictRowClassName,
  conflictSummaryClassName,
  detailHeadingClassName,
  detailSectionClassName,
  inspectorCloseButtonClassName,
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
  const { t } = useI18n();
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

      <ContextRailTabs activeTab={activeTab} onActiveTabChange={onActiveTabChange} />

      <ContextRailStopDetailSection
        selectedItem={selectedItem}
        canEdit={canEdit}
        canCreateSuggestion={canCreateSuggestion}
        onActiveTabChange={onActiveTabChange}
        onEditSelected={onEditSelected}
        onSuggestSelected={onSuggestSelected}
      />

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

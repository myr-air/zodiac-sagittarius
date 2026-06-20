import type {
  BookingDoc,
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
import { ContextRailExpensesSection } from "./ContextRailExpensesSection";
import { ContextRailSelectedStopPanel } from "./ContextRailSelectedStopPanel";
import { useContextRailState } from "./context-rail.state";
import { ContextRailTab } from "./context-rail.utils";
import {
  contextRailClassName,
  contextRailClosedClassName,
  contextRailOpenClassName,
  inspectorCloseButtonClassName,
  inspectorTitleClassName,
  inspectorTitleHeadingClassName,
  railInspectorClassName,
} from "./context-rail.styles";
import type {
  ContextRailBookingDocQuickFieldsChangeHandler,
  ContextRailBookingDocTypeChangeHandler,
  ContextRailCreateExpenseInput,
  ContextRailCreateNoteInput,
  ContextRailUpdateExpenseInput,
  ContextRailUpdateNoteInput,
} from "./context-rail.types";

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
  onChangeBookingDocType?: ContextRailBookingDocTypeChangeHandler;
  onChangeBookingDocQuickFields?: ContextRailBookingDocQuickFieldsChangeHandler;
  onCreateNote: (input: ContextRailCreateNoteInput) => void;
  onCreateExpense: (input: ContextRailCreateExpenseInput) => void;
  onUpdateExpense: (input: ContextRailUpdateExpenseInput) => void;
  onDeleteExpense: (expenseId: string) => void;
  onDeleteNote: (noteId: string) => void;
  onEditSelected: () => void;
  onReviewSuggestion: (
    suggestionId: string,
    decision: "approved" | "rejected",
  ) => void;
  onSuggestSelected: () => void;
  onToggleTaskStatus: (taskId: string) => void;
  onUpdateNote: (input: ContextRailUpdateNoteInput) => void;
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
  const {
    activeTab,
    setActiveTab,
    selectedAdvisories,
    selectedNotes,
    selectedExpenses,
    selectedTasks,
    selectedBookingDocs,
    selectedSuggestions,
  } = useContextRailState({
    trip,
    selectedItem,
    stopNotes,
    tasks,
    bookingDocs,
    suggestions,
    open,
    preferredTab,
  });

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

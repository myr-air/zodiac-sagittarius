import { useI18n } from "@/src/i18n/I18nProvider";
import { ContextRailExpensesOnlyPanel } from "./ContextRailExpensesOnlyPanel";
import { ContextRailSelectedStopPanel } from "./ContextRailSelectedStopPanel";
import { useContextRailState } from "./context-rail.state";
import {
  contextRailClassName,
  contextRailClosedClassName,
  contextRailOpenClassName,
} from "./context-rail.styles";
import type { ContextRailProps } from "./context-rail.types";

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
        <ContextRailExpensesOnlyPanel
          canEditExpenses={canEditExpenses}
          closeLabel={t.contextRail.closeDetails}
          expenseSummary={expenseSummary}
          expenses={selectedExpenses}
          members={trip.members}
          title={t.contextRail.expenses.title}
          onClose={onClose}
          onCreateExpense={onCreateExpense}
          onDeleteExpense={onDeleteExpense}
          onUpdateExpense={onUpdateExpense}
        />
      )}
    </aside>
  );
}

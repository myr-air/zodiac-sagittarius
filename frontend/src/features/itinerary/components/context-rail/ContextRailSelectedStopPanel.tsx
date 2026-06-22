import { useI18n } from "@/src/i18n/I18nProvider";
import { ContextRailBookingSection } from "./ContextRailBookingSection";
import { ContextRailConflictSection } from "./ContextRailConflictSection";
import { ContextRailExpensesSection } from "./ContextRailExpensesSection";
import { ContextRailNotesSection } from "./ContextRailNotesSection";
import { ContextRailPanelShell } from "./ContextRailPanelShell";
import { ContextRailSuggestionsSection } from "./ContextRailSuggestionsSection";
import { ContextRailStopDetailSection } from "./ContextRailStopDetailSection";
import { ContextRailTabs } from "./ContextRailTabs";
import { formatExpenseSummaryTotals } from "@/src/trip/expenses";
import type { ContextRailSelectedStopPanelProps } from "./context-rail.types";

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
  const expenseTotals = formatExpenseSummaryTotals(
    expenseSummary,
    trip.members.length,
  );

  return (
    <ContextRailPanelShell
      title={selectedItem.activity}
      closeLabel={t.contextRail.closeDetails}
      onClose={onClose}
    >
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

      <ContextRailConflictSection
        canReviewSuggestions={canReviewSuggestions}
      />

      <ContextRailExpensesSection
        selectedItemId={selectedItem.id}
        expenses={selectedExpenses}
        members={trip.members}
        perPerson={expenseTotals.perPerson}
        groupSpend={expenseTotals.groupSpend}
        canEditExpenses={canEditExpenses}
        onCreateExpense={onCreateExpense}
        onUpdateExpense={onUpdateExpense}
        onDeleteExpense={onDeleteExpense}
      />
    </ContextRailPanelShell>
  );
}

import { useI18n } from "@/src/i18n/I18nProvider";
import { OverviewExpenseShortcut } from "./OverviewExpenseShortcut";
import { OverviewFocusSection } from "./OverviewFocusSection";
import { OverviewHighlightsPanel } from "./OverviewSnapshotPanels";
import { TravelerChecklistPanel } from "./TravelerChecklistPanel";
import type { TravelerOverviewPanelsProps } from "./overview-role-panels.types";

export function TravelerOverviewPanels({
  trip,
  locale,
  items,
  groupSpendLabel,
  nextStop,
  nextDayItems,
  focusTodayHeading,
  isCompleted,
  openExpenses,
  taskListLabels,
  onToggleTask,
  foodStops,
  tripHighlights,
  focusSectionDetailFallback,
  taskStatusFilter,
  setTaskStatusFilter,
  visibleTasks,
  newTaskTitle,
  onTaskTitleChange,
  onSubmitTask,
  expenseNetLabel,
  expenseSettlementSuggestionsLabel,
}: TravelerOverviewPanelsProps) {
  const { t } = useI18n();

  return (
    <>
      <OverviewFocusSection
        ariaLabel={t.overview.sections.todayFocus}
        heading={focusTodayHeading}
        trip={trip}
        items={items}
        nextStop={nextStop}
        nextDayItems={nextDayItems}
        startDate={trip.startDate}
        locale={locale}
        groupSpendLabel={groupSpendLabel}
        isCompleted={isCompleted}
        focusListLabel={t.overview.sections.todayFocusStops}
        detailFallback={nextStop ? focusSectionDetailFallback : t.overview.focusDetails.travelerFallback}
        emptyText={t.overview.empty.itinerary}
      />

      <OverviewHighlightsPanel
        ariaLabel={t.overview.sections.travelerHighlights}
        emptyMessage={t.overview.empty.highlights}
        items={[...foodStops, ...tripHighlights].slice(0, 5)}
        locale={locale}
        startDate={trip.startDate}
        title={t.overview.headings.highlights}
      />

      <TravelerChecklistPanel
        addPersonalTaskLabel={t.overview.addPersonalTask}
        addTaskLabel={t.overview.addTask}
        allLabel={t.overview.filters.all}
        ariaLabel={t.overview.sections.travelChecklist}
        doneLabel={t.common.status.done}
        emptyMessage={t.overview.noChecklist}
        items={items}
        newTaskTitle={newTaskTitle}
        openLabel={t.common.status.open}
        placeholder={t.overview.personalTaskPlaceholder}
        statusFilterLabel={t.overview.filters.statusLabel}
        taskListLabels={taskListLabels}
        taskStatusFilter={taskStatusFilter}
        title={t.overview.checklist}
        trip={trip}
        visibleTasks={visibleTasks}
        onSubmitTask={onSubmitTask}
        onTaskStatusFilterChange={setTaskStatusFilter}
        onTaskTitleChange={onTaskTitleChange}
        onToggleTask={onToggleTask}
      />

      <OverviewExpenseShortcut
        icon="wallet"
        title={t.overview.expenses}
        value={expenseNetLabel}
        detail={expenseSettlementSuggestionsLabel}
        titleId="overview-traveler-budget-title"
        onClick={openExpenses}
      />
      <OverviewExpenseShortcut
        icon="plus"
        title={t.overview.generalExpense}
        value={t.overview.money.generalExamples}
        detail={t.overview.money.generalDetail}
        ariaLabel={t.overview.generalExpense}
        onClick={openExpenses}
      />
    </>
  );
}

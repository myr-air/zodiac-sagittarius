import { useI18n } from "@/src/i18n/I18nProvider";
import { OverviewExpenseShortcut } from "./OverviewExpenseShortcut";
import { OverviewFocusSection } from "./OverviewFocusSection";
import { TravelerChecklistPanel } from "./TravelerChecklistPanel";
import { ManagerReadinessPanel, ManagerTaskChecklistPanel } from "./ManagerChecklistPanel";
import { OverviewHighlightsPanel, ViewerNextStopSection } from "./OverviewSnapshotPanels";
import type { ManagerOverviewPanelsProps, TravelerOverviewPanelsProps, ViewerOverviewPanelsProps } from "./overview-role-panels.types";

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

export function ViewerOverviewPanels({ trip, locale, nextStop, viewerHighlights, expenseGroupSpend, openExpenses }: ViewerOverviewPanelsProps) {
  const { t } = useI18n();

  return (
    <>
      <OverviewHighlightsPanel
        ariaLabel={t.overview.sections.viewerSnapshot}
        emptyMessage={t.overview.empty.highlights}
        items={viewerHighlights}
        locale={locale}
        startDate={trip.startDate}
        title={t.overview.headings.viewerSnapshot}
      />

      <ViewerNextStopSection
        ariaLabel={t.overview.sections.nextStop}
        detailFallback={t.overview.focusDetails.viewerFallback}
        emptyMessage={t.overview.empty.itinerary}
        item={nextStop}
        locale={locale}
        startDate={trip.startDate}
        title={t.overview.headings.nextStop}
      />

      <OverviewExpenseShortcut
        icon="wallet"
        title={t.overview.headings.overallBudget}
        value={`HK$${expenseGroupSpend.toLocaleString("en-HK")}`}
        detail={t.overview.money.overallSummary}
        titleId="overview-viewer-budget-title"
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

export function ManagerOverviewPanels({
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
  taskScopeFilter,
  setTaskScopeFilter,
  taskStatusFilter,
  setTaskStatusFilter,
  myOpenTasks,
  sharedOpenTasks,
  pendingSuggestions,
  visibleTasks,
  focusSectionDetailFallback,
  openTaskDialog,
}: ManagerOverviewPanelsProps) {
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
        detailFallback={nextStop ? focusSectionDetailFallback : t.overview.focusDetails.managerFallback}
        emptyText={t.overview.empty.itinerary}
      />

      <ManagerReadinessPanel
        ariaLabel={t.overview.sections.readiness}
        myChecklistLabel={t.overview.readiness.myChecklist}
        myOpenTasks={myOpenTasks}
        pendingSuggestions={pendingSuggestions}
        pendingSuggestionsLabel={t.overview.readiness.pendingSuggestions}
        sharedChecklistLabel={t.overview.readiness.sharedChecklist}
        sharedOpenTasks={sharedOpenTasks}
        title={t.overview.headings.readiness}
      />

      <OverviewExpenseShortcut
        icon="plus"
        title={t.overview.generalExpense}
        value={t.overview.money.generalExamples}
        detail={t.overview.money.generalDetail}
        ariaLabel={t.overview.generalExpense}
        onClick={openExpenses}
      />

      <ManagerTaskChecklistPanel
        addChecklistLabel={t.overview.headings.addChecklist}
        allLabel={t.overview.filters.all}
        allStatusesLabel={t.overview.filters.allStatuses}
        ariaLabel={t.overview.sections.tripChecklist}
        doneLabel={t.overview.filters.done}
        emptyMessage={t.overview.task.emptyFilter}
        includeStopMeta
        includeTripKindMeta
        items={items}
        mineLabel={t.overview.filters.mine}
        onAddTask={openTaskDialog}
        onScopeFilterChange={setTaskScopeFilter}
        onStatusFilterChange={setTaskStatusFilter}
        onToggleTask={onToggleTask}
        openLabel={t.overview.filters.open}
        scopeFilter={taskScopeFilter}
        scopeFilterLabel={t.overview.filters.scopeLabel}
        statusFilter={taskStatusFilter}
        statusFilterLabel={t.overview.filters.statusLabel}
        taskListLabels={taskListLabels}
        tasks={visibleTasks}
        title={t.overview.headings.tripChecklist}
        trip={trip}
        tripLabel={t.overview.filters.trip}
      />
    </>
  );
}

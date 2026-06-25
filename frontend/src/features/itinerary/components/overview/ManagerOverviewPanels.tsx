import { useI18n } from "@/src/i18n/I18nProvider";
import { ManagerReadinessPanel } from "./ManagerReadinessPanel";
import { ManagerTaskChecklistPanel } from "./ManagerTaskChecklistPanel";
import { OverviewExpenseShortcut } from "./OverviewExpenseShortcut";
import { OverviewFocusSection } from "./OverviewFocusSection";
import type { ManagerOverviewPanelsProps } from "./overview-role-panels.types";

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

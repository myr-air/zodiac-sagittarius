import { useI18n } from "@/src/i18n/I18nProvider";
import {
  overviewGridClassName,
  overviewPageClassName,
} from "./overview-page.styles";
import { OverviewLensPanels } from "./OverviewLensPanels";
import { OverviewSummaryBand } from "./OverviewSummaryBand";
import { OverviewTaskLayer } from "./OverviewTaskLayer";
import {
  buildOverviewTaskListLabels,
  renderOverviewCurrentMemberCard,
} from "./overview-page-derived";
import { buildOverviewPageModel } from "./overview-page-model";
import type { OverviewPageProps } from "./OverviewPage.types";
import { useOverviewTaskState } from "./use-overview-task-state";

export function OverviewPage({
  trip,
  currentMemberId,
  expenseSummary,
  items,
  itineraryView,
  suggestions,
  tasks,
  dailyBriefings = [],
  onCreateTask,
  onOpenExpenses,
  onSaveDailyBriefingOverrides,
  onToggleTaskStatus,
}: OverviewPageProps) {
  const { locale, t } = useI18n();
  const {
    closeTaskDialog,
    isTaskDialogOpen,
    myOpenTasks,
    newTaskAssigneeId,
    newTaskTitle,
    newTaskVisibility,
    openTaskDialog,
    setNewTaskAssigneeId,
    setNewTaskTitle,
    setNewTaskVisibility,
    setTaskScope,
    setTaskStatusFilter,
    sharedOpenTasks,
    submitTask,
    taskScope,
    taskStatusFilter,
    toggleTask,
    undoTask,
    undoTaskToggle,
    visibleTasks,
  } = useOverviewTaskState({
    currentMemberId,
    onCreateTask,
    onToggleTaskStatus,
    tasks,
  });
  const {
    activeMembers,
    assignableMembers,
    countdown,
    currentMember,
    focusTodayHeading,
    foodStops,
    groupSpendLabel,
    heroVisual,
    highlightItems,
    isCompleted,
    isManagerLens,
    isTravelerLens,
    isViewerLens,
    nextDayItems,
    nextStop,
    pendingSuggestions,
    roleLens,
    settlementCount,
    tripHighlights,
    viewerHighlights,
    warningCount,
  } = buildOverviewPageModel({
    currentMemberId,
    expenseSummary,
    focusTodayLabel: t.overview.focusToday,
    items,
    itineraryView,
    locale,
    suggestions,
    trip,
  });
  /* v8 ignore next */
  const currentMemberCard = renderOverviewCurrentMemberCard(currentMember, trip);

  function openExpenses() {
    onOpenExpenses?.();
  }

  const taskListLabels = buildOverviewTaskListLabels({
    assignee: t.overview.task,
    kind: {
      booking: t.overview.task.booking,
      prep: t.overview.task.prep,
      planStop: t.overview.task.planStop,
    },
  });

  return (
    <section className={overviewPageClassName} aria-label={t.overview.pageLabel}>
      <OverviewSummaryBand
        activeMembers={activeMembers}
        countdown={countdown}
        currentMemberCard={currentMemberCard}
        dailyBriefings={dailyBriefings}
        groupSpendLabel={groupSpendLabel}
        heroVisual={heroVisual}
        highlightItems={highlightItems}
        isManagerLens={isManagerLens}
        items={items}
        nextStop={nextStop}
        pendingSuggestions={pendingSuggestions}
        roleLens={roleLens}
        settlementCount={settlementCount}
        trip={trip}
        warningCount={warningCount}
        onOpenExpenses={openExpenses}
        onSaveDailyBriefingOverrides={onSaveDailyBriefingOverrides}
      />

      <div className={overviewGridClassName}>
        <OverviewLensPanels
          expenseSummary={expenseSummary}
          focusDetails={t.overview.focusDetails}
          focusTodayHeading={focusTodayHeading}
          foodStops={foodStops}
          groupSpendLabel={groupSpendLabel}
          isCompleted={isCompleted}
          isManagerLens={isManagerLens}
          isTravelerLens={isTravelerLens}
          isViewerLens={isViewerLens}
          items={items}
          locale={locale}
          money={{
            settlementSuggestions: t.overview.money.settlementSuggestions({
              count: expenseSummary.settlementSuggestions.length,
            }),
          }}
          myOpenTasks={myOpenTasks}
          newTaskTitle={newTaskTitle}
          nextDayItems={nextDayItems}
          nextStop={nextStop}
          onOpenExpenses={openExpenses}
          onSubmitTask={submitTask}
          onTaskTitleChange={setNewTaskTitle}
          onToggleTask={toggleTask}
          openTaskDialog={openTaskDialog}
          pendingSuggestions={pendingSuggestions}
          setTaskScopeFilter={setTaskScope}
          setTaskStatusFilter={setTaskStatusFilter}
          sharedOpenTasks={sharedOpenTasks}
          taskListLabels={taskListLabels}
          taskScopeFilter={taskScope}
          taskStatusFilter={taskStatusFilter}
          trip={trip}
          tripHighlights={tripHighlights}
          viewerHighlights={viewerHighlights}
          visibleTasks={visibleTasks}
        />
      </div>
      <OverviewTaskLayer
        assignableMembers={assignableMembers}
        assigneeId={newTaskAssigneeId}
        isOpen={isTaskDialogOpen}
        onAssigneeChange={setNewTaskAssigneeId}
        onClose={closeTaskDialog}
        onSubmit={submitTask}
        onTitleChange={setNewTaskTitle}
        onUndoTaskToggle={undoTaskToggle}
        onVisibilityChange={setNewTaskVisibility}
        title={newTaskTitle}
        undoTask={undoTask}
        visibility={newTaskVisibility}
      />
    </section>
  );
}

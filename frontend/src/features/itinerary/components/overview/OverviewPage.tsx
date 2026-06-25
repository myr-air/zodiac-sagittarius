import {
  overviewGridClassName,
  overviewPageClassName,
} from "./overview-page.styles";
import { photoBoardEmptyMessage } from "@/src/features/itinerary/domain/overview";
import { HighlightBoard } from "./OverviewHighlightBoard";
import { OverviewLensPanels } from "./OverviewLensPanels";
import { OverviewPhasePanel } from "./OverviewPhasePanel";
import { OverviewSummaryBand } from "./OverviewSummaryBand";
import { OverviewTaskLayer } from "./OverviewTaskLayer";
import type { OverviewPageProps } from "./OverviewPage.types";
import { useOverviewPageState } from "./use-overview-page-state";

export function OverviewPage(props: OverviewPageProps) {
  const {
    trip,
    expenseSummary,
    items,
    tasks,
    dailyBriefings = [],
    onSaveDailyBriefingOverrides,
  } = props;
  const {
    currentMemberCard,
    locale,
    model,
    openExpenses,
    t,
    taskListLabels,
    taskState,
  } = useOverviewPageState(props);
  const {
    activeMembers,
    assignableMembers,
    countdown,
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
  } = model;
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
  } = taskState;
  const phasePanel = (
    <OverviewPhasePanel
      activeMembers={activeMembers}
      countdown={countdown}
      dailyBriefings={dailyBriefings}
      highlightItems={highlightItems}
      nextStop={nextStop}
      pendingSuggestions={pendingSuggestions}
      settlementCount={settlementCount}
      tasks={tasks}
      warningCount={warningCount}
    />
  );

  return (
    <section className={overviewPageClassName} aria-label={t.overview.pageLabel}>
      <OverviewSummaryBand
        activeMembers={activeMembers}
        countdown={countdown}
        currentMemberCard={currentMemberCard}
        dailyBriefings={dailyBriefings}
        groupSpendLabel={groupSpendLabel}
        heroVisual={heroVisual}
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

      {isCompleted ? phasePanel : null}

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

      {isCompleted ? null : phasePanel}

      <HighlightBoard
        items={highlightItems}
        startDate={trip.startDate}
        locale={locale}
        emptyMessage={
          isManagerLens
            ? t.overview.empty.highlights
            : photoBoardEmptyMessage(t.overview.empty.highlights)
        }
        title={t.overview.highlightBoard.title}
        subtitle={t.overview.highlightBoard.subtitle}
      />
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

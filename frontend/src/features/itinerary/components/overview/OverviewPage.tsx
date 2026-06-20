import { useI18n } from "@/src/i18n/I18nProvider";
import { PageUserCard } from "@/src/shared/components/page-header";
import { type OverviewTaskListLabels } from "./OverviewTaskList";
import {
  overviewGridClassName,
  overviewPageClassName,
} from "./overview-page.styles";
import {
  managerNextStopDetail,
  travelerNextStopDetail,
} from "@/src/features/itinerary/domain";
import { ManagerOverviewPanels } from "./ManagerOverviewPanels";
import { TravelerOverviewPanels } from "./TravelerOverviewPanels";
import { ViewerOverviewPanels } from "./ViewerOverviewPanels";
import { OverviewSummaryBand } from "./OverviewSummaryBand";
import { OverviewTaskLayer } from "./OverviewTaskLayer";
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
    completedFocusHeading: locale === "th" ? "ย้อนรอยความทรงจำ" : "Memories of the Journey",
    currentMemberId,
    expenseSummary,
    focusTodayLabel: t.overview.focusToday,
    incomingFocusHeading: locale === "th" ? "จุดสตาร์ทแรกของทริป" : "First Stop Preview",
    items,
    itineraryView,
    locale,
    suggestions,
    trip,
  });
  /* v8 ignore next */
  const currentMemberCard = currentMember ? <PageUserCard color={currentMember.color} name={currentMember.displayName} label={trip.destinationLabel} /> : null;

  function openExpenses() {
    onOpenExpenses?.();
  }

  const taskListLabels: OverviewTaskListLabels = {
    assignee: t.overview.task,
    kind: {
      booking: t.overview.task.booking,
      prep: t.overview.task.prep,
      planStop: t.overview.task.planStop,
    },
  };

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
        {isTravelerLens ? (
          <TravelerOverviewPanels
            trip={trip}
            locale={locale}
            items={items}
            groupSpendLabel={groupSpendLabel}
            nextStop={nextStop}
            nextDayItems={nextDayItems}
            focusTodayHeading={focusTodayHeading}
            isCompleted={isCompleted}
            openExpenses={openExpenses}
            taskListLabels={taskListLabels}
            onToggleTask={toggleTask}
            foodStops={foodStops}
            tripHighlights={tripHighlights}
            focusSectionDetailFallback={nextStop ? travelerNextStopDetail(nextStop, t.overview.focusDetails.travelerFallback) : t.overview.focusDetails.travelerFallback}
            taskStatusFilter={taskStatusFilter}
            setTaskStatusFilter={setTaskStatusFilter}
            visibleTasks={visibleTasks}
            newTaskTitle={newTaskTitle}
            onTaskTitleChange={setNewTaskTitle}
            onSubmitTask={submitTask}
            expenseNetLabel={expenseSummary.currentUserNetLabel}
            expenseSettlementSuggestionsLabel={t.overview.money.settlementSuggestions({ count: expenseSummary.settlementSuggestions.length })}
          />
        ) : null}

        {isViewerLens ? (
          <ViewerOverviewPanels
            trip={trip}
            locale={locale}
            nextStop={nextStop}
            openExpenses={openExpenses}
            viewerHighlights={viewerHighlights}
            expenseGroupSpend={expenseSummary.groupSpend}
          />
        ) : null}

        {isManagerLens ? (
          <ManagerOverviewPanels
            trip={trip}
            locale={locale}
            items={items}
            groupSpendLabel={groupSpendLabel}
            nextStop={nextStop}
            nextDayItems={nextDayItems}
            focusTodayHeading={focusTodayHeading}
            isCompleted={isCompleted}
            openExpenses={openExpenses}
            taskListLabels={taskListLabels}
            onToggleTask={toggleTask}
            taskScopeFilter={taskScope}
            setTaskScopeFilter={setTaskScope}
            taskStatusFilter={taskStatusFilter}
            setTaskStatusFilter={setTaskStatusFilter}
            myOpenTasks={myOpenTasks}
            sharedOpenTasks={sharedOpenTasks}
            pendingSuggestions={pendingSuggestions}
            visibleTasks={visibleTasks}
            focusSectionDetailFallback={nextStop ? managerNextStopDetail(nextStop, t.overview.focusDetails.managerFallback) : t.overview.focusDetails.managerFallback}
            openTaskDialog={openTaskDialog}
          />
        ) : null}
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

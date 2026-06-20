import type { DailyBriefingOverrides, ExpenseSummary, ItineraryItem, Suggestion, Trip, TripDailyBriefing, TripTask } from "@/src/trip/types";
import { useI18n } from "@/src/i18n/I18nProvider";
import { type ItineraryView } from "@/src/trip/itinerary";
import { formatTripRange, PageUserCard } from "@/src/shared/components/page-header";
import { HighlightBoard, OverviewHero } from "./OverviewSections";
import { type OverviewTaskListLabels } from "./OverviewTaskList";
import {
  overviewGridClassName,
  overviewPageClassName,
} from "./overview-page.styles";
import {
  managerNextStopDetail,
  photoBoardEmptyMessage,
  travelerNextStopDetail,
} from "@/src/features/itinerary/domain";
import { ManagerOverviewPanels, TravelerOverviewPanels, ViewerOverviewPanels } from "./OverviewRolePanels";
import { OverviewCockpit } from "./OverviewCockpit";
import { OverviewTaskLayer } from "./OverviewTaskLayer";
import { OverviewWeatherBriefing } from "./OverviewWeatherBriefing";
import { buildOverviewPageModel } from "./overview-page-model";
import { useOverviewTaskState } from "./use-overview-task-state";

interface OverviewPageProps {
  trip: Trip;
  currentMemberId: string;
  expenseSummary: ExpenseSummary;
  items: ItineraryItem[];
  itineraryView?: ItineraryView;
  suggestions: Suggestion[];
  tasks: TripTask[];
  dailyBriefings?: TripDailyBriefing[];
  onCreateTask: (input: { title: string; visibility: TripTask["visibility"]; assigneeId?: string | null }) => void;
  onOpenExpenses?: () => void;
  onSaveDailyBriefingOverrides?: (date: string, version: number, overrides: DailyBriefingOverrides) => void;
  onToggleTaskStatus: (taskId: string) => void;
}

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
      <OverviewHero
        title={trip.name}
        roleTitle={t.overview.roleHeadings[roleLens]}
        destinationLabel={trip.destinationLabel}
        dateRange={formatTripRange(trip.startDate, trip.endDate, locale)}
        activeMembersLabel={t.dates.activeMembers({ count: activeMembers })}
        groupSpendLabel={groupSpendLabel}
        settlementCount={settlementCount}
        visual={heroVisual}
        currentMemberCard={currentMemberCard}
        countdown={countdown}
      />
      <OverviewWeatherBriefing
        canEdit={isManagerLens}
        dailyBriefings={dailyBriefings}
        locale={locale}
        onSaveDailyBriefingOverrides={onSaveDailyBriefingOverrides}
      />

      <OverviewCockpit
        activeMembers={activeMembers}
        groupSpendLabel={groupSpendLabel}
        itemCount={items.length}
        labels={{
          alertSummary: t.overview.readiness.alertSummary,
          budget: t.overview.cockpit.budget,
          crewReadiness: t.overview.cockpit.crewReadiness,
          dayCount: t.dates.dayCount,
          memberCount: t.dates.memberCount,
          nextStop: t.overview.cockpit.nextStop,
          openExpenses: t.overview.money.openExpenses,
          settlementSuggestions: t.overview.money.settlementSuggestions,
          stopCount: t.dates.stopCount,
        }}
        locale={locale}
        nextStop={nextStop}
        onOpenExpenses={openExpenses}
        pendingSuggestions={pendingSuggestions}
        settlementCount={settlementCount}
        trip={trip}
        warningCount={warningCount}
      />

      <HighlightBoard
        items={highlightItems}
        startDate={trip.startDate}
        locale={locale}
        emptyMessage={isManagerLens ? t.overview.empty.highlights : photoBoardEmptyMessage(t.overview.empty.highlights)}
        title={t.overview.highlightBoard.title}
        subtitle={t.overview.highlightBoard.subtitle}
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

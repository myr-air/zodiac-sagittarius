import type { DailyBriefingOverrides, ExpenseSummary, ItineraryItem, Suggestion, Trip, TripDailyBriefing, TripTask } from "@/src/trip/types";
import { useI18n } from "@/src/i18n/I18nProvider";
import { type ItineraryView } from "@/src/trip/itinerary";
import { formatTripRange, PageUserCard } from "@/src/shared/components/page-header";
import { HighlightBoard, OverviewHero } from "./OverviewSections";
import { type OverviewTaskListLabels } from "./OverviewTaskList";
import {
  overviewGridClassName,
  overviewPageClassName,
  overviewUndoToastClassName,
} from "./overview-page.styles";
import {
  buildDestinationVisual,
  buildHighlightItems,
  getCountdownBadge,
  managerNextStopDetail,
  overviewRoleLens,
  photoBoardEmptyMessage,
  travelerNextStopDetail,
} from "@/src/features/itinerary/domain";
import { ManagerOverviewPanels, TravelerOverviewPanels, ViewerOverviewPanels } from "./OverviewRolePanels";
import { OverviewCockpit } from "./OverviewCockpit";
import { OverviewTaskDialog } from "./OverviewTaskDialog";
import { OverviewWeatherBriefing } from "./OverviewWeatherBriefing";
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
  const countdown = getCountdownBadge(trip.startDate, trip.endDate, locale);
  const isCompleted = countdown.type === "completed";
  const focusTodayHeading = isCompleted
    ? (locale === "th" ? "ย้อนรอยความทรงจำ" : "Memories of the Journey")
    : (countdown.type === "incoming"
      ? (locale === "th" ? "จุดสตาร์ทแรกของทริป" : "First Stop Preview")
      : t.overview.focusToday);
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
  /* v8 ignore next */
  const sortedItems = itineraryView?.sortedItems ?? items.slice().sort((a, b) => a.day.localeCompare(b.day) || a.sortOrder - b.sortOrder || a.startTime.localeCompare(b.startTime));
  const nextStop = sortedItems[0];
  const warningCount = itineraryView?.warningCount ?? items.reduce((total, item) => total + (item.advisories?.length ?? 0), 0);
  const pendingSuggestions = suggestions.filter((suggestion) => suggestion.status === "pending").length;
  const activeMembers = trip.members.filter((member) => member.id !== "member-viewer" && member.accessStatus !== "disabled").length;
  const groupSpendLabel = `HK$${expenseSummary.groupSpend.toLocaleString("en-HK")}`;
  const settlementCount = expenseSummary.settlementSuggestions.length;
  const heroVisual = buildDestinationVisual(trip.destinationLabel);
  const highlightItems = buildHighlightItems(sortedItems);
  const currentMember = trip.members.find((member) => member.id === currentMemberId);
  /* v8 ignore next */
  const currentMemberCard = currentMember ? <PageUserCard color={currentMember.color} name={currentMember.displayName} label={trip.destinationLabel} /> : null;
  const roleLens = overviewRoleLens(currentMember);
  const isManagerLens = roleLens === "manager";
  const isTravelerLens = roleLens === "traveler";
  const isViewerLens = roleLens === "viewer";
  const assignableMembers = trip.members.filter((member) => member.id !== "member-viewer" && member.accessStatus !== "disabled");
  const nextDayItems = nextStop ? sortedItems.filter((item) => item.day === nextStop.day).slice(0, 4) : [];
  const foodStops = sortedItems.filter((item) => item.activityType === "food").slice(0, 3);
  const tripHighlights = sortedItems.filter((item) => ["attraction", "experience", "shopping"].includes(item.activityType)).slice(0, 4);
  const viewerHighlights = sortedItems.filter((item) => item.activityType !== "travel").slice(0, 5);
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
      {isTaskDialogOpen ? (
        <OverviewTaskDialog
          assignableMembers={assignableMembers}
          assigneeId={newTaskAssigneeId}
          labels={{
            assigneeLabel: t.overview.task.assigneeLabel,
            cancel: t.overview.task.cancel,
            closeForm: t.overview.task.closeForm,
            noAssignee: t.overview.task.noAssignee,
            private: t.overview.task.private,
            shared: t.overview.task.shared,
            submit: t.overview.task.submit,
            title: t.overview.headings.addChecklist,
            titleLabel: t.overview.task.titleLabel,
            titlePlaceholder: t.overview.task.titlePlaceholder,
            visibilityLabel: t.overview.task.visibilityLabel,
          }}
          onAssigneeChange={setNewTaskAssigneeId}
          onClose={closeTaskDialog}
          onSubmit={submitTask}
          onTitleChange={setNewTaskTitle}
          onVisibilityChange={setNewTaskVisibility}
          title={newTaskTitle}
          visibility={newTaskVisibility}
        />
      ) : null}
      {undoTask ? (
        <div className={overviewUndoToastClassName} role="status">
          <span>{t.overview.task.changed({ title: undoTask.title })}</span>
          <button type="button" onClick={undoTaskToggle}>{t.overview.task.undo}</button>
        </div>
      ) : null}
    </section>
  );
}

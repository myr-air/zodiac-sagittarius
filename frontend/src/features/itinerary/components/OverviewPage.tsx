import { type FormEvent, useMemo, useState } from "react";
import type { DailyBriefingOverrides, ExpenseSummary, ItineraryItem, Suggestion, Trip, TripDailyBriefing, TripTask } from "@/src/trip/types";
import { useI18n } from "@/src/i18n/I18nProvider";
import { cn } from "@/src/lib/cn";
import { formatDayLabel, getTripDates, type ItineraryView } from "@/src/trip/itinerary";
import { Icon } from "@/src/ui/icons";
import { formatTripRange, PageUserCard } from "@/src/components/PageHeader";
import { Button, SegmentedControl, Select, TextInput } from "@/src/ui";
import { WeatherBriefingDrawer } from "@/src/components/WeatherBriefingDrawer";
import { WeatherForecastStrip } from "@/src/components/WeatherForecastStrip";
import { CockpitCard, HighlightBoard, OverviewFocusList, OverviewHero, OverviewStopList, ViewerNextStopPanel } from "./overview";
import { OverviewTaskList, type OverviewTaskListLabels } from "./overview/OverviewTaskList";
import { OverviewFocusSection } from "./overview/OverviewFocusSection";
import {
  overviewMutedClassName,
} from "./overview/overview.styles";
import {
  dialogFieldWideClassName,
  overviewReadinessChipsClassName,
  modalBackdropClassName,
  overviewCockpitClassName,
  overviewGridClassName,
  overviewHealthGridClassName,
  overviewPageClassName,
  overviewPanelButtonClassName,
  overviewPanelClassName,
  overviewPanelHealthClassName,
  overviewPanelTitleClassName,
  overviewPanelWideClassName,
  overviewTaskAddButtonClassName,
  overviewTaskFilterActiveClassName,
  overviewTaskFiltersClassName,
  overviewTaskPanelClassName,
  overviewTaskToolbarClassName,
  overviewUndoToastClassName,
  personalTaskFormClassName,
  taskDialogActionsClassName,
  taskDialogClassName,
  taskDialogFormClassName,
  taskDialogGridClassName,
  taskDialogTitleRowClassName,
} from "./overview/overview-page.styles";
import {
  buildDestinationVisual,
  buildHighlightItems,
  getCountdownBadge,
  isMyTask,
  managerNextStopDetail,
  overviewRoleLens,
  photoBoardEmptyMessage,
  travelerNextStopDetail,
} from "@/src/features/itinerary/domain";

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
  const [taskScope, setTaskScope] = useState<"mine" | "trip" | "all">("mine");
  const [taskStatusFilter, setTaskStatusFilter] = useState<"all" | "open" | "done">("all");
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskVisibility, setNewTaskVisibility] = useState<TripTask["visibility"]>("private");
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState("");
  const [undoTask, setUndoTask] = useState<TripTask | null>(null);
  const [selectedBriefingDate, setSelectedBriefingDate] = useState<string | null>(null);
  const tripDays = getTripDates(trip.startDate, trip.endDate);
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
  const myOpenTasks = tasks.filter((task) => task.status === "open" && isMyTask(task, currentMemberId)).length;
  const sharedOpenTasks = tasks.filter((task) => task.status === "open" && task.visibility === "shared").length;
  const nextDayItems = nextStop ? sortedItems.filter((item) => item.day === nextStop.day).slice(0, 4) : [];
  const foodStops = sortedItems.filter((item) => item.activityType === "food").slice(0, 3);
  const tripHighlights = sortedItems.filter((item) => ["attraction", "experience", "shopping"].includes(item.activityType)).slice(0, 4);
  const viewerHighlights = sortedItems.filter((item) => item.activityType !== "travel").slice(0, 5);
  const selectedBriefing = dailyBriefings.find((briefing) => briefing.date === selectedBriefingDate) ?? null;
  const visibleTasks = useMemo(
    () =>
      tasks.filter((task) => {
        if (taskScope === "mine" && !isMyTask(task, currentMemberId)) return false;
        if (taskScope === "trip" && task.visibility !== "shared") return false;
        if (taskStatusFilter === "open") return task.status === "open";
        if (taskStatusFilter === "done") return task.status === "done";
        return true;
      }),
    [currentMemberId, taskScope, taskStatusFilter, tasks],
  );

  function submitTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = newTaskTitle.trim();
    if (!title) return;
    onCreateTask({ title, visibility: newTaskVisibility, assigneeId: newTaskAssigneeId || null });
    setNewTaskTitle("");
    setNewTaskVisibility("private");
    setNewTaskAssigneeId("");
    setTaskScope(newTaskVisibility === "shared" ? "trip" : "mine");
    setTaskStatusFilter("all");
    setIsTaskDialogOpen(false);
  }

  function closeTaskDialog() {
    setIsTaskDialogOpen(false);
    setNewTaskTitle("");
    setNewTaskVisibility("private");
    setNewTaskAssigneeId("");
  }

  function toggleTask(task: TripTask) {
    onToggleTaskStatus(task.id);
    setUndoTask(task);
  }

  function undoTaskToggle() {
    if (!undoTask) return;
    onToggleTaskStatus(undoTask.id);
    setUndoTask(null);
  }

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
      <WeatherForecastStrip
        briefings={dailyBriefings}
        locale={locale}
        selectedDate={selectedBriefingDate}
        onSelect={setSelectedBriefingDate}
      />
      <WeatherBriefingDrawer
        briefing={selectedBriefing}
        locale={locale}
        canEdit={isManagerLens}
        isOpen={Boolean(selectedBriefing)}
        onClose={() => setSelectedBriefingDate(null)}
        onSaveOverrides={onSaveDailyBriefingOverrides}
      />

      <section className={overviewCockpitClassName} aria-label="travel cockpit">
        <CockpitCard
          icon="route"
          label={t.overview.cockpit.nextStop}
          value={nextStop?.place ?? trip.destinationLabel}
          detail={nextStop ? `${formatDayLabel(nextStop.day, trip.startDate, locale)} · ${nextStop.startTime}` : t.dates.stopCount({ count: items.length })}
        />
        <CockpitCard
          icon="wallet"
          label={t.overview.cockpit.budget}
          ariaLabel={t.overview.money.openExpenses}
          value={groupSpendLabel}
          detail={t.overview.money.settlementSuggestions({ count: settlementCount })}
          onClick={openExpenses}
        />
        <CockpitCard
          icon="users"
          label={t.overview.cockpit.crewReadiness}
          value={t.dates.memberCount({ count: activeMembers })}
          detail={(
            <span className={overviewReadinessChipsClassName}>
              <span>{t.dates.dayCount({ count: tripDays.length })}</span>
              <span>{t.overview.readiness.alertSummary({ warnings: warningCount, suggestions: pendingSuggestions })}</span>
            </span>
          )}
        />
      </section>

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
              detailFallback={nextStop ? travelerNextStopDetail(nextStop, t.overview.focusDetails.travelerFallback) : t.overview.focusDetails.travelerFallback}
              emptyText={t.overview.empty.itinerary}
            />

            <section className={cn(overviewPanelClassName, overviewPanelWideClassName)} aria-label={t.overview.sections.travelerHighlights}>
              <div className={overviewPanelTitleClassName}>
                <Icon name="location" />
                <h2>{t.overview.headings.highlights}</h2>
              </div>
              <OverviewStopList items={[...foodStops, ...tripHighlights].slice(0, 5)} startDate={trip.startDate} locale={locale} emptyMessage={t.overview.empty.highlights} />
            </section>

            <section className={cn(overviewPanelClassName, overviewTaskPanelClassName)} aria-label={t.overview.sections.travelChecklist}>
              <div className={overviewPanelTitleClassName}>
                <Icon name="check" />
                <h2>{t.overview.checklist}</h2>
              </div>
              <div className={overviewTaskToolbarClassName}>
                <SegmentedControl
                  aria-label={t.overview.filters.statusLabel}
                  className={overviewTaskFiltersClassName}
                  selectedItemClassName={overviewTaskFilterActiveClassName}
                  value={taskStatusFilter}
                  options={[
                    { value: "all", label: t.overview.filters.all },
                    { value: "open", label: t.common.status.open },
                    { value: "done", label: t.common.status.done },
                  ]}
                  onChange={setTaskStatusFilter}
                />
              </div>
              <form className={personalTaskFormClassName} onSubmit={submitTask}>
                <label>
                  <span>{t.overview.addPersonalTask}</span>
                  <input value={newTaskTitle} onChange={(event) => setNewTaskTitle(event.target.value)} placeholder={t.overview.personalTaskPlaceholder} />
                </label>
                <button type="submit" disabled={!newTaskTitle.trim()}>{t.overview.addTask}</button>
              </form>
              <OverviewTaskList
                tasks={visibleTasks}
                trip={trip}
                items={items}
                labels={taskListLabels}
                emptyMessage={t.overview.noChecklist}
                onToggleTask={toggleTask}
              />
            </section>

            <button className={cn(overviewPanelClassName, overviewPanelButtonClassName)} type="button" onClick={openExpenses}>
              <div className={overviewPanelTitleClassName}>
                <Icon name="wallet" />
                <h2 id="overview-traveler-budget-title">{t.overview.expenses}</h2>
              </div>
              <strong>{expenseSummary.currentUserNetLabel}</strong>
              <span>{t.overview.money.settlementSuggestions({ count: expenseSummary.settlementSuggestions.length })}</span>
            </button>

            <button className={cn(overviewPanelClassName, overviewPanelButtonClassName)} type="button" aria-label={t.overview.generalExpense} onClick={openExpenses}>
              <div className={overviewPanelTitleClassName}>
                <Icon name="plus" />
                <h2>{t.overview.generalExpense}</h2>
              </div>
              <strong>{t.overview.money.generalExamples}</strong>
              <span>{t.overview.money.generalDetail}</span>
            </button>
          </>
        ) : null}

        {isViewerLens ? (
          <>
            <section className={cn(overviewPanelClassName, overviewPanelWideClassName)} aria-label={t.overview.sections.viewerSnapshot}>
              <div className={overviewPanelTitleClassName}>
                <Icon name="location" />
                <h2>{t.overview.headings.viewerSnapshot}</h2>
              </div>
              <OverviewStopList items={viewerHighlights} startDate={trip.startDate} locale={locale} emptyMessage={t.overview.empty.highlights} />
            </section>

            <section className={overviewPanelClassName} aria-label={t.overview.sections.nextStop}>
              <div className={overviewPanelTitleClassName}>
                <Icon name="route" />
                <h2>{t.overview.headings.nextStop}</h2>
              </div>
              <ViewerNextStopPanel
                item={nextStop}
                startDate={trip.startDate}
                locale={locale}
                emptyMessage={t.overview.empty.itinerary}
                detailFallback={t.overview.focusDetails.viewerFallback}
              />
            </section>

            <button className={cn(overviewPanelClassName, overviewPanelButtonClassName)} type="button" onClick={openExpenses}>
              <div className={overviewPanelTitleClassName}>
                <Icon name="wallet" />
                <h2 id="overview-viewer-budget-title">{t.overview.headings.overallBudget}</h2>
              </div>
              <strong>HK${expenseSummary.groupSpend.toLocaleString("en-HK")}</strong>
              <span>{t.overview.money.overallSummary}</span>
            </button>

            <button className={cn(overviewPanelClassName, overviewPanelButtonClassName)} type="button" aria-label={t.overview.generalExpense} onClick={openExpenses}>
              <div className={overviewPanelTitleClassName}>
                <Icon name="plus" />
                <h2>{t.overview.generalExpense}</h2>
              </div>
              <strong>{t.overview.money.generalExamples}</strong>
              <span>{t.overview.money.generalDetail}</span>
            </button>
          </>
        ) : null}

        {isManagerLens ? (
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
              detailFallback={nextStop ? managerNextStopDetail(nextStop, t.overview.focusDetails.managerFallback) : t.overview.focusDetails.managerFallback}
              emptyText={t.overview.empty.itinerary}
            />

            <section className={cn(overviewPanelClassName, overviewPanelHealthClassName)} aria-label={t.overview.sections.readiness}>
          <div className={overviewPanelTitleClassName}>
            <Icon name="check" />
            <h2>{t.overview.headings.readiness}</h2>
          </div>
          <div className={overviewHealthGridClassName}>
            <span><strong>{myOpenTasks}</strong> {t.overview.readiness.myChecklist}</span>
            <span><strong>{sharedOpenTasks}</strong> {t.overview.readiness.sharedChecklist}</span>
            <span><strong>{pendingSuggestions}</strong> {t.overview.readiness.pendingSuggestions}</span>
          </div>
            </section>

            <button className={cn(overviewPanelClassName, overviewPanelButtonClassName)} type="button" aria-label={t.overview.generalExpense} onClick={openExpenses}>
          <div className={overviewPanelTitleClassName}>
            <Icon name="plus" />
            <h2>{t.overview.generalExpense}</h2>
          </div>
          <strong>{t.overview.money.generalExamples}</strong>
          <span>{t.overview.money.generalDetail}</span>
            </button>

            <section className={cn(overviewPanelClassName, overviewTaskPanelClassName)} aria-label={t.overview.sections.tripChecklist}>
          <div className={overviewPanelTitleClassName}>
            <Icon name="check" />
            <h2>{t.overview.headings.tripChecklist}</h2>
          </div>
          <div className={overviewTaskToolbarClassName}>
            <SegmentedControl
              aria-label={t.overview.filters.scopeLabel}
              className={overviewTaskFiltersClassName}
              selectedItemClassName={overviewTaskFilterActiveClassName}
              value={taskScope}
              options={[
                { value: "mine", label: t.overview.filters.mine },
                { value: "trip", label: t.overview.filters.trip },
                { value: "all", label: t.overview.filters.all },
              ]}
              onChange={setTaskScope}
            />
            <SegmentedControl
              aria-label={t.overview.filters.statusLabel}
              className={overviewTaskFiltersClassName}
              selectedItemClassName={overviewTaskFilterActiveClassName}
              value={taskStatusFilter}
              options={[
                { value: "all", label: t.overview.filters.allStatuses },
                { value: "open", label: t.overview.filters.open },
                { value: "done", label: t.overview.filters.done },
              ]}
              onChange={setTaskStatusFilter}
            />
            <button className={overviewTaskAddButtonClassName} type="button" aria-label={t.overview.headings.addChecklist} title={t.overview.headings.addChecklist} onClick={() => setIsTaskDialogOpen(true)}>
              <span aria-hidden="true">+</span>
            </button>
          </div>
              <OverviewTaskList
                tasks={visibleTasks}
                trip={trip}
                items={items}
                labels={taskListLabels}
                emptyMessage={t.overview.task.emptyFilter}
                includeTripKindMeta
                includeStopMeta
                onToggleTask={toggleTask}
              />
            </section>
          </>
        ) : null}
      </div>
      {isTaskDialogOpen ? (
        <div className={modalBackdropClassName} role="presentation">
          <section className={taskDialogClassName} role="dialog" aria-modal="true" aria-labelledby="task-dialog-title">
            <div className={taskDialogTitleRowClassName}>
              <h2 id="task-dialog-title">{t.overview.headings.addChecklist}</h2>
              <button type="button" aria-label={t.overview.task.closeForm} onClick={closeTaskDialog}>
                <Icon name="x" />
              </button>
            </div>

            <form className={taskDialogFormClassName} onSubmit={submitTask}>
              <div className={taskDialogGridClassName}>
                <label className={dialogFieldWideClassName}>
                  <span>{t.overview.task.titleLabel}</span>
                  <TextInput value={newTaskTitle} onChange={(event) => setNewTaskTitle(event.target.value)} placeholder={t.overview.task.titlePlaceholder} />
                </label>
                <label>
                  <span>{t.overview.task.visibilityLabel}</span>
                  <Select value={newTaskVisibility} onChange={(event) => setNewTaskVisibility(event.target.value as TripTask["visibility"])}>
                    <option value="private">{t.overview.task.private}</option>
                    <option value="shared">{t.overview.task.shared}</option>
                  </Select>
                </label>
                <label>
                  <span>{t.overview.task.assigneeLabel}</span>
                  <Select value={newTaskAssigneeId} disabled={newTaskVisibility === "private"} onChange={(event) => setNewTaskAssigneeId(event.target.value)}>
                    <option value="">{t.overview.task.noAssignee}</option>
                    {assignableMembers.map((member) => (
                      <option key={member.id} value={member.id}>{member.displayName}</option>
                    ))}
                  </Select>
                </label>
              </div>

              <div className={taskDialogActionsClassName}>
                <Button type="button" variant="ghost" onClick={closeTaskDialog}>{t.overview.task.cancel}</Button>
                <Button type="submit" disabled={!newTaskTitle.trim()}>{t.overview.task.submit}</Button>
              </div>
            </form>
          </section>
        </div>
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

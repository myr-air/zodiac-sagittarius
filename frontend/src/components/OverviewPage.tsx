import { type FormEvent, useMemo, useState } from "react";
import type { ExpenseSummary, ItineraryItem, Member, Suggestion, Trip, TripTask } from "@/src/trip/types";
import { useI18n } from "@/src/i18n/I18nProvider";
import type { Locale } from "@/src/i18n/types";
import { formatDayLabel, getTripDates, validateItineraryItem } from "@/src/trip/itinerary";
import { Icon } from "./icons";
import { TravelMotif } from "./motifs";
import { formatTripRange, PageHeader, PageUserCard } from "./PageHeader";

interface OverviewPageProps {
  trip: Trip;
  currentMemberId: string;
  expenseSummary: ExpenseSummary;
  items: ItineraryItem[];
  suggestions: Suggestion[];
  tasks: TripTask[];
  onCreateTask: (input: { title: string; visibility: TripTask["visibility"]; assigneeId?: string | null }) => void;
  onOpenExpenses?: () => void;
  onToggleTaskStatus: (taskId: string) => void;
}

export function OverviewPage({ trip, currentMemberId, expenseSummary, items, suggestions, tasks, onCreateTask, onOpenExpenses, onToggleTaskStatus }: OverviewPageProps) {
  const { locale, t } = useI18n();
  const [taskScope, setTaskScope] = useState<"mine" | "trip" | "all">("mine");
  const [taskStatusFilter, setTaskStatusFilter] = useState<"all" | "open" | "done">("all");
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskVisibility, setNewTaskVisibility] = useState<TripTask["visibility"]>("private");
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState("");
  const [undoTask, setUndoTask] = useState<TripTask | null>(null);
  const tripDays = getTripDates(trip.startDate, trip.endDate);
  /* v8 ignore next */
  const sortedItems = useMemo(() => items.slice().sort((a, b) => a.day.localeCompare(b.day) || a.sortOrder - b.sortOrder || a.startTime.localeCompare(b.startTime)), [items]);
  const nextStop = sortedItems[0];
  const warningCount = items.reduce((total, item) => total + validateItineraryItem(item, items.filter((candidate) => candidate.day === item.day)).length, 0);
  const pendingSuggestions = suggestions.filter((suggestion) => suggestion.status === "pending").length;
  const activeMembers = trip.members.filter((member) => member.id !== "member-viewer" && member.accessStatus !== "disabled").length;
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

  return (
    <section className="overview-page" aria-label={t.overview.pageLabel}>
      <PageHeader
        title={t.overview.roleHeadings[roleLens]}
        subtitle={trip.name}
        meta={(
          <>
            <span><Icon name="calendar" /> {formatTripRange(trip.startDate, trip.endDate, locale)}</span>
            <span><Icon name="location" /> {trip.destinationLabel}</span>
            <span><Icon name="users" /> {t.dates.activeMembers({ count: activeMembers })}</span>
          </>
        )}
        motif={<TravelMotif tone="postcard" />}
        aside={currentMemberCard}
      />

      <div className="overview-stat-grid" aria-label={t.overview.summaryLabel}>
        <OverviewStat icon="calendar" label={t.overview.stats.duration} value={t.dates.dayCount({ count: tripDays.length })} />
        <OverviewStat icon="location" label={t.overview.stats.activities} value={t.dates.stopCount({ count: items.length })} />
        <OverviewStat icon="wallet" label={t.overview.stats.totalSpend} value={`HK$${expenseSummary.groupSpend.toLocaleString("en-HK")}`} />
        <OverviewStat icon="users" label={t.overview.stats.activeMembers} value={t.dates.memberCount({ count: activeMembers })} />
      </div>

      <div className="overview-grid">
        {isTravelerLens ? (
          <>
            <section className="overview-panel overview-panel--wide" aria-label={t.overview.sections.todayFocus}>
              <div className="overview-panel-title">
                <Icon name="route" />
                <h2>{t.overview.focusToday}</h2>
              </div>
              {nextStop ? (
                <div className="overview-next-stop">
                  <strong>{nextStop.activity}</strong>
                  <span>{formatDayLabel(nextStop.day, trip.startDate, locale)} · {nextStop.startTime} · {nextStop.place}</span>
                  <p>{travelerNextStopDetail(nextStop, t.overview.focusDetails.travelerFallback)}</p>
                </div>
              ) : (
                <p className="overview-muted">{t.overview.empty.itinerary}</p>
              )}
              <OverviewFocusList items={nextDayItems} startDate={trip.startDate} locale={locale} label={t.overview.sections.todayFocusStops} />
            </section>

            <section className="overview-panel overview-panel--wide" aria-label={t.overview.sections.travelerHighlights}>
              <div className="overview-panel-title">
                <Icon name="location" />
                <h2>{t.overview.headings.highlights}</h2>
              </div>
              <OverviewStopList items={[...foodStops, ...tripHighlights].slice(0, 5)} startDate={trip.startDate} locale={locale} emptyMessage={t.overview.empty.highlights} />
            </section>

            <section className="overview-panel overview-task-panel" aria-label={t.overview.sections.travelChecklist}>
              <div className="overview-panel-title">
                <Icon name="check" />
                <h2>{t.overview.checklist}</h2>
              </div>
              <div className="overview-task-toolbar">
                <div className="overview-task-filters" role="group" aria-label={t.overview.filters.statusLabel}>
                  <button className={taskStatusFilter === "all" ? "overview-task-filter overview-task-filter--active" : "overview-task-filter"} type="button" onClick={() => setTaskStatusFilter("all")}>{t.overview.filters.all}</button>
                  <button className={taskStatusFilter === "open" ? "overview-task-filter overview-task-filter--active" : "overview-task-filter"} type="button" onClick={() => setTaskStatusFilter("open")}>{t.common.status.open}</button>
                  <button className={taskStatusFilter === "done" ? "overview-task-filter overview-task-filter--active" : "overview-task-filter"} type="button" onClick={() => setTaskStatusFilter("done")}>{t.common.status.done}</button>
                </div>
              </div>
              <form className="overview-task-form overview-task-form--personal" onSubmit={submitTask}>
                <label>
                  <span>{t.overview.addPersonalTask}</span>
                  <input value={newTaskTitle} onChange={(event) => setNewTaskTitle(event.target.value)} placeholder={t.overview.personalTaskPlaceholder} />
                </label>
                <button type="submit" disabled={!newTaskTitle.trim()}>{t.overview.addTask}</button>
              </form>
              {visibleTasks.length ? (
                <ul className="overview-task-list">
                  {visibleTasks.map((task) => (
                    <li className="overview-task-item" key={task.id} aria-label={task.title} data-status={task.status}>
                      <label>
                        <input type="checkbox" checked={task.status === "done"} onChange={() => toggleTask(task)} />
                        <span>{task.title}</span>
                      </label>
                      <div className="overview-task-meta">
                        <small className={`overview-task-scope overview-task-scope--${task.visibility}`}>{task.visibility === "private" ? t.overview.task.private : t.overview.task.shared}</small>
                        <small>{assigneeLabel(task, trip, t.overview.task)}</small>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="overview-muted">{t.overview.noChecklist}</p>
              )}
            </section>

            <button className="overview-panel overview-panel--button" type="button" aria-label={t.overview.money.openExpenses} onClick={openExpenses}>
              <div className="overview-panel-title">
                <Icon name="wallet" />
                <h2>{t.overview.expenses}</h2>
              </div>
              <strong>{expenseSummary.currentUserNetLabel}</strong>
              <span>{t.overview.money.settlementSuggestions({ count: expenseSummary.settlementSuggestions.length })}</span>
            </button>

            <button className="overview-panel overview-panel--button" type="button" aria-label={t.overview.generalExpense} onClick={openExpenses}>
              <div className="overview-panel-title">
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
            <section className="overview-panel overview-panel--wide" aria-label={t.overview.sections.viewerSnapshot}>
              <div className="overview-panel-title">
                <Icon name="location" />
                <h2>{t.overview.headings.viewerSnapshot}</h2>
              </div>
              <OverviewStopList items={viewerHighlights} startDate={trip.startDate} locale={locale} emptyMessage={t.overview.empty.highlights} />
            </section>

            <section className="overview-panel" aria-label={t.overview.sections.nextStop}>
              <div className="overview-panel-title">
                <Icon name="route" />
                <h2>{t.overview.headings.nextStop}</h2>
              </div>
              {viewerNextStopPanel(nextStop, trip.startDate, locale, t.overview.empty.itinerary, t.overview.focusDetails.viewerFallback)}
            </section>

            <button className="overview-panel overview-panel--button" type="button" aria-label={t.overview.money.openExpenses} onClick={openExpenses}>
              <div className="overview-panel-title">
                <Icon name="wallet" />
                <h2>{t.overview.headings.overallBudget}</h2>
              </div>
              <strong>HK${expenseSummary.groupSpend.toLocaleString("en-HK")}</strong>
              <span>{t.overview.money.overallSummary}</span>
            </button>

            <button className="overview-panel overview-panel--button" type="button" aria-label={t.overview.generalExpense} onClick={openExpenses}>
              <div className="overview-panel-title">
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
            <section className="overview-panel overview-panel--wide" aria-label={t.overview.sections.todayFocus}>
          <div className="overview-panel-title">
            <Icon name="route" />
            <h2>{t.overview.focusToday}</h2>
          </div>
          {nextStop ? (
            <div className="overview-next-stop">
              <strong>{nextStop.activity}</strong>
              <span>{formatDayLabel(nextStop.day, trip.startDate, locale)} · {nextStop.startTime} · {nextStop.place}</span>
              <p>{managerNextStopDetail(nextStop, t.overview.focusDetails.managerFallback)}</p>
            </div>
          ) : (
            <p className="overview-muted">{t.overview.empty.itinerary}</p>
          )}
          <OverviewFocusList items={nextDayItems} startDate={trip.startDate} locale={locale} label={t.overview.sections.todayFocusStops} />
            </section>

            <section className="overview-panel overview-panel--health" aria-label={t.overview.sections.readiness}>
          <div className="overview-panel-title">
            <Icon name="check" />
            <h2>{t.overview.headings.readiness}</h2>
          </div>
          <div className="overview-health-grid">
            <span><strong>{myOpenTasks}</strong> {t.overview.readiness.myChecklist}</span>
            <span><strong>{sharedOpenTasks}</strong> {t.overview.readiness.sharedChecklist}</span>
            <span><strong>{pendingSuggestions}</strong> {t.overview.readiness.pendingSuggestions}</span>
          </div>
            </section>

            <section className="overview-panel" aria-label={t.overview.sections.alerts}>
          <div className="overview-panel-title">
            <Icon name="alertCircle" />
            <h2>{t.overview.headings.alerts}</h2>
          </div>
          <strong>{warningCount + pendingSuggestions}</strong>
          <span>{t.overview.readiness.alertSummary({ warnings: warningCount, suggestions: pendingSuggestions })}</span>
            </section>

            <button className="overview-panel overview-panel--button" type="button" aria-label={t.overview.money.openExpenses} onClick={openExpenses}>
          <div className="overview-panel-title">
            <Icon name="wallet" />
            <h2>{t.overview.headings.budget}</h2>
          </div>
          <strong>{expenseSummary.currentUserNetLabel}</strong>
          <span>{t.overview.money.settlementSuggestions({ count: expenseSummary.settlementSuggestions.length })}</span>
            </button>

            <button className="overview-panel overview-panel--button" type="button" aria-label={t.overview.generalExpense} onClick={openExpenses}>
          <div className="overview-panel-title">
            <Icon name="plus" />
            <h2>{t.overview.generalExpense}</h2>
          </div>
          <strong>{t.overview.money.generalExamples}</strong>
          <span>{t.overview.money.generalDetail}</span>
            </button>

            <section className="overview-panel overview-task-panel" aria-label={t.overview.sections.tripChecklist}>
          <div className="overview-panel-title">
            <Icon name="check" />
            <h2>{t.overview.headings.tripChecklist}</h2>
          </div>
          <div className="overview-task-toolbar">
            <div className="overview-task-filters" role="group" aria-label={t.overview.filters.scopeLabel}>
              <button className={taskScope === "mine" ? "overview-task-filter overview-task-filter--active" : "overview-task-filter"} type="button" onClick={() => setTaskScope("mine")}>{t.overview.filters.mine}</button>
              <button className={taskScope === "trip" ? "overview-task-filter overview-task-filter--active" : "overview-task-filter"} type="button" onClick={() => setTaskScope("trip")}>{t.overview.filters.trip}</button>
              <button className={taskScope === "all" ? "overview-task-filter overview-task-filter--active" : "overview-task-filter"} type="button" onClick={() => setTaskScope("all")}>{t.overview.filters.all}</button>
            </div>
            <div className="overview-task-filters" role="group" aria-label={t.overview.filters.statusLabel}>
              <button className={taskStatusFilter === "all" ? "overview-task-filter overview-task-filter--active" : "overview-task-filter"} type="button" onClick={() => setTaskStatusFilter("all")}>{t.overview.filters.allStatuses}</button>
              <button className={taskStatusFilter === "open" ? "overview-task-filter overview-task-filter--active" : "overview-task-filter"} type="button" onClick={() => setTaskStatusFilter("open")}>{t.overview.filters.open}</button>
              <button className={taskStatusFilter === "done" ? "overview-task-filter overview-task-filter--active" : "overview-task-filter"} type="button" onClick={() => setTaskStatusFilter("done")}>{t.overview.filters.done}</button>
            </div>
            <button className="overview-task-add-button" type="button" aria-label={t.overview.headings.addChecklist} title={t.overview.headings.addChecklist} onClick={() => setIsTaskDialogOpen(true)}>
              <span aria-hidden="true">+</span>
            </button>
          </div>
          {visibleTasks.length ? (
            <ul className="overview-task-list">
              {visibleTasks.map((task) => (
                <li className="overview-task-item" key={task.id} aria-label={task.title} data-status={task.status}>
                  <label>
                    <input type="checkbox" checked={task.status === "done"} onChange={() => toggleTask(task)} />
                    <span>{task.title}</span>
                  </label>
                  <div className="overview-task-meta">
                    <small className={`overview-task-scope overview-task-scope--${task.visibility}`}>{task.visibility === "private" ? t.overview.task.private : t.overview.task.shared}</small>
                    <small>{taskKindLabel(task, t.overview.task)}</small>
                    <small>{task.relatedItemId ? stopLabel(task.relatedItemId, items, t.overview.task.planStop) : assigneeLabel(task, trip, t.overview.task)}</small>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="overview-muted">{t.overview.task.emptyFilter}</p>
          )}
            </section>
          </>
        ) : null}
      </div>
      {isTaskDialogOpen ? (
        <div className="modal-backdrop" role="presentation">
          <section className="stop-dialog overview-task-dialog" role="dialog" aria-modal="true" aria-labelledby="task-dialog-title">
            <div className="dialog-title-row">
              <h2 id="task-dialog-title">{t.overview.headings.addChecklist}</h2>
              <button type="button" aria-label={t.overview.task.closeForm} onClick={closeTaskDialog}>
                <Icon name="x" />
              </button>
            </div>

            <form className="overview-task-form overview-task-form--dialog" onSubmit={submitTask}>
              <div className="dialog-grid">
                <label className="dialog-field-wide">
                  <span>{t.overview.task.titleLabel}</span>
                  <input value={newTaskTitle} onChange={(event) => setNewTaskTitle(event.target.value)} placeholder={t.overview.task.titlePlaceholder} />
                </label>
                <label>
                  <span>{t.overview.task.visibilityLabel}</span>
                  <select value={newTaskVisibility} onChange={(event) => setNewTaskVisibility(event.target.value as TripTask["visibility"])}>
                    <option value="private">{t.overview.task.private}</option>
                    <option value="shared">{t.overview.task.shared}</option>
                  </select>
                </label>
                <label>
                  <span>{t.overview.task.assigneeLabel}</span>
                  <select value={newTaskAssigneeId} disabled={newTaskVisibility === "private"} onChange={(event) => setNewTaskAssigneeId(event.target.value)}>
                    <option value="">{t.overview.task.noAssignee}</option>
                    {assignableMembers.map((member) => (
                      <option key={member.id} value={member.id}>{member.displayName}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="dialog-actions">
                <button className="button button--ghost" type="button" onClick={closeTaskDialog}>{t.overview.task.cancel}</button>
                <button className="button button--primary" type="submit" disabled={!newTaskTitle.trim()}>{t.overview.task.submit}</button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
      {undoTask ? (
        <div className="overview-undo-toast" role="status">
          <span>{t.overview.task.changed({ title: undoTask.title })}</span>
          <button type="button" onClick={undoTaskToggle}>{t.overview.task.undo}</button>
        </div>
      ) : null}
    </section>
  );
}

type OverviewRoleLens = "manager" | "traveler" | "viewer";

function overviewRoleLens(member?: Member): OverviewRoleLens {
  if (member?.role === "owner" || member?.role === "organizer") return "manager";
  if (member?.role === "traveler") return "traveler";
  return "viewer";
}

function OverviewStopList({ items, startDate, locale, emptyMessage }: { items: ItineraryItem[]; startDate: string; locale: Locale; emptyMessage: string }) {
  if (!items.length) return <p className="overview-muted">{emptyMessage}</p>;

  return (
    <ul className="overview-stop-list">
      {items.map((item) => (
        <li key={item.id}>
          <span>{formatDayLabel(item.day, startDate, locale)} · {item.startTime}</span>
          <strong>{item.activity}</strong>
          <small>{item.place}</small>
        </li>
      ))}
    </ul>
  );
}

function OverviewFocusList({ items, startDate, locale, label }: { items: ItineraryItem[]; startDate: string; locale: Locale; label: string }) {
  if (items.length <= 1) return null;

  return (
    <ul className="overview-focus-list" aria-label={label}>
      {items.slice(1).map((item) => (
        <li key={item.id}>
          <span>{formatDayLabel(item.day, startDate, locale)} · {item.startTime}</span>
          <strong>{item.activity}</strong>
        </li>
      ))}
    </ul>
  );
}

function stopLabel(itemId: string, items: ItineraryItem[], fallback: string): string {
  /* v8 ignore next */
  return items.find((item) => item.id === itemId)?.activity ?? fallback;
}

function travelerNextStopDetail(item: ItineraryItem, fallback: string): string {
  /* v8 ignore next */
  return item.transportation || item.note || fallback;
}

function viewerNextStopDetail(item: ItineraryItem, fallback: string): string {
  /* v8 ignore next */
  return item.transportation || fallback;
}

function viewerNextStopPanel(item: ItineraryItem | undefined, startDate: string, locale: Locale, emptyMessage: string, detailFallback: string) {
  /* v8 ignore next */
  return item ? (
    <div className="overview-next-stop">
      <strong>{item.activity}</strong>
      <span>{formatDayLabel(item.day, startDate, locale)} · {item.startTime} · {item.place}</span>
      <p>{viewerNextStopDetail(item, detailFallback)}</p>
    </div>
  ) : (
    <p className="overview-muted">{emptyMessage}</p>
  );
}

function managerNextStopDetail(item: ItineraryItem, fallback: string): string {
  /* v8 ignore next */
  return item.transportation || fallback;
}

function taskKindLabel(task: TripTask, labels: { booking: string; prep: string }): string {
  if (task.kind === "booking" || task.relatedItemId || task.title.includes("จอง")) return labels.booking;
  return labels.prep;
}

function isMyTask(task: TripTask, currentMemberId: string): boolean {
  return task.createdBy === currentMemberId || task.assigneeId === currentMemberId;
}

function assigneeLabel(task: TripTask, trip: Trip, labels: { mine: string; unassigned: string; tripMember: string }): string {
  if (task.visibility === "private") return labels.mine;
  if (!task.assigneeId) return labels.unassigned;
  /* v8 ignore next */
  return trip.members.find((member) => member.id === task.assigneeId)?.displayName ?? labels.tripMember;
}

function OverviewStat({ icon, label, value }: { icon: "calendar" | "location" | "users" | "wallet"; label: string; value: string }) {
  return (
    <div className="overview-stat">
      <Icon name={icon} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

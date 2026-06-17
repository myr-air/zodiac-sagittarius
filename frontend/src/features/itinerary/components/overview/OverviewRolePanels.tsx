import type { FormEvent } from "react";
import { Icon } from "@/src/ui/icons";
import { useI18n } from "@/src/i18n/I18nProvider";
import type { Locale } from "@/src/i18n/types";
import type { ItineraryItem, Trip, TripTask } from "@/src/trip/types";
import { SegmentedControl } from "@/src/ui";
import { OverviewExpenseShortcut } from "./OverviewExpenseShortcut";
import { OverviewFocusSection } from "./OverviewFocusSection";
import { OverviewStopList, ViewerNextStopPanel } from "./OverviewSections";
import { OverviewTaskList, type OverviewTaskListLabels } from "./OverviewTaskList";
import {
  overviewHealthGridClassName,
  overviewPanelClassName,
  overviewPanelHealthClassName,
  overviewPanelTitleClassName,
  overviewPanelWideClassName,
  overviewTaskAddButtonClassName,
  overviewTaskFilterActiveClassName,
  overviewTaskFiltersClassName,
  overviewTaskPanelClassName,
  overviewTaskToolbarClassName,
  personalTaskFormClassName,
} from "./overview-page.styles";

type TaskScopeFilter = "mine" | "trip" | "all";
type TaskStatusFilter = "all" | "open" | "done";

interface OverviewChecklistPanelBaseProps {
  trip: Trip;
  locale: Locale;
  items: ItineraryItem[];
  groupSpendLabel: string;
  nextStop: ItineraryItem | undefined;
  nextDayItems: ItineraryItem[];
  focusTodayHeading: string;
  isCompleted: boolean;
  openExpenses: () => void;
  taskListLabels: OverviewTaskListLabels;
  onToggleTask: (task: TripTask) => void;
}

interface TravelerOverviewPanelsProps extends OverviewChecklistPanelBaseProps {
  foodStops: ItineraryItem[];
  tripHighlights: ItineraryItem[];
  focusSectionDetailFallback: string;
  taskStatusFilter: TaskStatusFilter;
  setTaskStatusFilter: (filter: TaskStatusFilter) => void;
  visibleTasks: TripTask[];
  newTaskTitle: string;
  onTaskTitleChange: (title: string) => void;
  onSubmitTask: (event: FormEvent<HTMLFormElement>) => void;
  expenseNetLabel: string;
  expenseSettlementSuggestionsLabel: string;
}

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

      <section className={`${overviewPanelClassName} ${overviewPanelWideClassName}`} aria-label={t.overview.sections.travelerHighlights}>
        <div className={overviewPanelTitleClassName}>
          <Icon name="location" />
          <h2>{t.overview.headings.highlights}</h2>
        </div>
        <OverviewStopList items={[...foodStops, ...tripHighlights].slice(0, 5)} startDate={trip.startDate} locale={locale} emptyMessage={t.overview.empty.highlights} />
      </section>

      <section className={`${overviewPanelClassName} ${overviewTaskPanelClassName}`} aria-label={t.overview.sections.travelChecklist}>
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
        <form className={personalTaskFormClassName} onSubmit={onSubmitTask}>
          <label>
            <span>{t.overview.addPersonalTask}</span>
            <input value={newTaskTitle} onChange={(event) => onTaskTitleChange(event.target.value)} placeholder={t.overview.personalTaskPlaceholder} />
          </label>
          <button type="submit" disabled={!newTaskTitle.trim()}>{t.overview.addTask}</button>
        </form>

        <OverviewTaskList
          tasks={visibleTasks}
          trip={trip}
          items={items}
          labels={taskListLabels}
          emptyMessage={t.overview.noChecklist}
          onToggleTask={onToggleTask}
        />
      </section>

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

interface ViewerOverviewPanelsProps {
  trip: Trip;
  locale: Locale;
  viewerHighlights: ItineraryItem[];
  expenseGroupSpend: number;
  nextStop: ItineraryItem | undefined;
  openExpenses: () => void;
}

export function ViewerOverviewPanels({ trip, locale, nextStop, viewerHighlights, expenseGroupSpend, openExpenses }: ViewerOverviewPanelsProps) {
  const { t } = useI18n();

  return (
    <>
      <section className={`${overviewPanelClassName} ${overviewPanelWideClassName}`} aria-label={t.overview.sections.viewerSnapshot}>
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

interface ManagerOverviewPanelsProps extends OverviewChecklistPanelBaseProps {
  taskScopeFilter: TaskScopeFilter;
  setTaskScopeFilter: (filter: TaskScopeFilter) => void;
  taskStatusFilter: TaskStatusFilter;
  setTaskStatusFilter: (filter: TaskStatusFilter) => void;
  myOpenTasks: number;
  sharedOpenTasks: number;
  pendingSuggestions: number;
  visibleTasks: TripTask[];
  focusSectionDetailFallback: string;
  openTaskDialog: () => void;
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

      <section className={`${overviewPanelClassName} ${overviewPanelHealthClassName}`} aria-label={t.overview.sections.readiness}>
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

      <OverviewExpenseShortcut
        icon="plus"
        title={t.overview.generalExpense}
        value={t.overview.money.generalExamples}
        detail={t.overview.money.generalDetail}
        ariaLabel={t.overview.generalExpense}
        onClick={openExpenses}
      />

      <section className={`${overviewPanelClassName} ${overviewTaskPanelClassName}`} aria-label={t.overview.sections.tripChecklist}>
        <div className={overviewPanelTitleClassName}>
          <Icon name="check" />
          <h2>{t.overview.headings.tripChecklist}</h2>
        </div>
        <div className={overviewTaskToolbarClassName}>
          <SegmentedControl
            aria-label={t.overview.filters.scopeLabel}
            className={overviewTaskFiltersClassName}
            selectedItemClassName={overviewTaskFilterActiveClassName}
            value={taskScopeFilter}
            options={[
              { value: "mine", label: t.overview.filters.mine },
              { value: "trip", label: t.overview.filters.trip },
              { value: "all", label: t.overview.filters.all },
            ]}
            onChange={setTaskScopeFilter}
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
          <button className={overviewTaskAddButtonClassName} type="button" aria-label={t.overview.headings.addChecklist} title={t.overview.headings.addChecklist} onClick={openTaskDialog}>
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
          onToggleTask={onToggleTask}
        />
      </section>
    </>
  );
}

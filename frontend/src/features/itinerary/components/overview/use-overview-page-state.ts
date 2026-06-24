import { useI18n } from "@/src/i18n/I18nProvider";
import {
  buildOverviewTaskListLabels,
  renderOverviewCurrentMemberCard,
} from "./overview-page-derived";
import { buildOverviewPageModel } from "./overview-page-model";
import type { OverviewPageProps } from "./OverviewPage.types";
import { useOverviewTaskState } from "./use-overview-task-state";

export function useOverviewPageState({
  trip,
  currentMemberId,
  expenseSummary,
  items,
  itineraryView,
  suggestions,
  tasks,
  onCreateTask,
  onOpenExpenses,
  onToggleTaskStatus,
}: OverviewPageProps) {
  const { locale, t } = useI18n();
  const taskState = useOverviewTaskState({
    currentMemberId,
    onCreateTask,
    onToggleTaskStatus,
    tasks,
  });
  const model = buildOverviewPageModel({
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
  const currentMemberCard = renderOverviewCurrentMemberCard(
    model.currentMember,
    trip,
  );

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

  return {
    currentMemberCard,
    locale,
    model,
    openExpenses,
    t,
    taskListLabels,
    taskState,
  };
}

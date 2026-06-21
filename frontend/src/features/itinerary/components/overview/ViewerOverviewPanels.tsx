import { useI18n } from "@/src/i18n/I18nProvider";
import { OverviewExpenseShortcut } from "./OverviewExpenseShortcut";
import { OverviewHighlightsPanel, ViewerNextStopSection } from "./OverviewSnapshotPanels";
import type { ViewerOverviewPanelsProps } from "./overview-role-panels.types";

export function ViewerOverviewPanels({
  trip,
  locale,
  nextStop,
  viewerHighlights,
  groupSpendLabel,
  openExpenses,
}: ViewerOverviewPanelsProps) {
  const { t } = useI18n();

  return (
    <>
      <OverviewHighlightsPanel
        ariaLabel={t.overview.sections.viewerSnapshot}
        emptyMessage={t.overview.empty.highlights}
        items={viewerHighlights}
        locale={locale}
        startDate={trip.startDate}
        title={t.overview.headings.viewerSnapshot}
      />

      <ViewerNextStopSection
        ariaLabel={t.overview.sections.nextStop}
        detailFallback={t.overview.focusDetails.viewerFallback}
        emptyMessage={t.overview.empty.itinerary}
        item={nextStop}
        locale={locale}
        startDate={trip.startDate}
        title={t.overview.headings.nextStop}
      />

      <OverviewExpenseShortcut
        icon="wallet"
        title={t.overview.headings.overallBudget}
        value={groupSpendLabel}
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

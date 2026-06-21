import { vi } from "vitest";
import { buildExpenseSummary } from "@/src/trip/expenses";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { seedTrip } from "@/src/trip/seed";
import { tripFixtureTasks } from "@/src/trip/trip-fixtures";
import { OverviewPage } from "../../OverviewPage";

export const renderOverviewElement = (ui: Parameters<typeof renderWithI18n>[0]) =>
  renderWithI18n(ui, { locale: "th" });

export function installOverviewPageClock() {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-06-18T12:00:00Z"));
}

export function renderOverview(currentMemberId: string) {
  const onOpenExpenses = vi.fn();
  renderOverviewElement(
    <OverviewPage
      currentMemberId={currentMemberId}
      expenseSummary={buildExpenseSummary(seedTrip.expenses, currentMemberId)}
      items={seedTrip.itineraryItems}
      suggestions={[]}
      tasks={tripFixtureTasks}
      trip={seedTrip}
      onCreateTask={vi.fn()}
      onOpenExpenses={onOpenExpenses}
      onToggleTaskStatus={vi.fn()}
    />,
  );
  return { onOpenExpenses };
}

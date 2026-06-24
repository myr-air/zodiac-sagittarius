import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { FormEvent, ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { tripFixture, tripFixtureTasks } from "@/src/trip/testing/fixtures/trip-fixtures";
import { renderWithI18n } from "@/src/i18n/test-utils";
import type { Locale } from "@/src/i18n/types";
import { ManagerOverviewPanels } from "../ManagerOverviewPanels";
import { TravelerOverviewPanels } from "../TravelerOverviewPanels";
import { ViewerOverviewPanels } from "../ViewerOverviewPanels";

const overviewTaskListLabels = {
  assignee: {
    private: "Private",
    shared: "Shared",
    tripMember: "Trip member",
    unassigned: "Unassigned",
  },
  kind: {
    booking: "Booking",
    prep: "Prep",
    planStop: "Plan stop",
  },
};

const locale = "en" as const satisfies Locale;

const items = tripFixture.planItems;
const nextStop = items[0]!;
const nextDayItems = items.slice(1, 4);

function render(component: ReactElement) {
  return renderWithI18n(component, { locale });
}

describe("OverviewRolePanels", () => {
  it("renders traveler-focused checklist, highlights, and expense shortcuts", () => {
    render(
      <TravelerOverviewPanels
        trip={tripFixture.trip}
        locale={locale}
        items={items}
        groupSpendLabel="HK$999"
        nextStop={nextStop}
        nextDayItems={nextDayItems}
        focusTodayHeading="Today and next focus"
        isCompleted={false}
        openExpenses={() => {}}
        taskListLabels={overviewTaskListLabels}
        onToggleTask={vi.fn()}
        foodStops={items.slice(0, 2)}
        tripHighlights={items.slice(2, 5)}
        focusSectionDetailFallback="Traveler fallback"
        taskStatusFilter="all"
        setTaskStatusFilter={vi.fn()}
        visibleTasks={tripFixtureTasks}
        newTaskTitle="Pack charger"
        onTaskTitleChange={vi.fn()}
        onSubmitTask={(event: FormEvent<HTMLFormElement>) => event.preventDefault()}
        expenseNetLabel={tripFixture.expenseSummaries.traveler.currentUserNetLabel}
        expenseSettlementSuggestionsLabel="Pending settlements: 2"
      />,
    );

    expect(screen.getByRole("region", { name: /today and next focus/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /traveler highlights/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /my travel checklist/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/for example, pack a travel adapter/i)).toHaveValue("Pack charger");
    expect(within(screen.getByRole("region", { name: /my travel checklist/i })).getByText(tripFixtureTasks[0]!.title)).toBeInTheDocument();
  });

  it("renders read-only viewer snapshot and no checklist controls", () => {
    render(
      <ViewerOverviewPanels
        trip={tripFixture.trip}
        locale={locale}
        viewerHighlights={items.slice(0, 3)}
        nextStop={nextStop}
        openExpenses={vi.fn()}
        groupSpendLabel="HK$1,234.50"
      />,
    );

    expect(screen.getByRole("region", { name: /read-only trip snapshot/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /next important stop/i })).toBeInTheDocument();
    expect(screen.getByText("HK$1,234.50")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.queryByRole("button", { name: /add checklist item/i })).toBeNull();
  });

  it("renders manager readiness and forwards checklist scope/filter controls", async () => {
    const user = userEvent.setup();
    const openTaskDialog = vi.fn();
    const onToggleTask = vi.fn();
    const setTaskScopeFilter = vi.fn();
    const setTaskStatusFilter = vi.fn();

    render(
      <ManagerOverviewPanels
        trip={tripFixture.trip}
        locale={locale}
        items={items}
        groupSpendLabel="HK$999"
        nextStop={nextStop}
        nextDayItems={nextDayItems}
        focusTodayHeading="Today and next focus"
        isCompleted={false}
        openExpenses={vi.fn()}
        taskListLabels={overviewTaskListLabels}
        onToggleTask={onToggleTask}
        taskScopeFilter="mine"
        setTaskScopeFilter={setTaskScopeFilter}
        taskStatusFilter="open"
        setTaskStatusFilter={setTaskStatusFilter}
        myOpenTasks={3}
        sharedOpenTasks={5}
        pendingSuggestions={2}
        visibleTasks={tripFixtureTasks}
        focusSectionDetailFallback="Manager fallback"
        openTaskDialog={openTaskDialog}
      />,
    );

    expect(screen.getByRole("region", { name: /trip readiness/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /trip checklist/i })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: /checklist scope/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /add checklist item/i }));
    expect(openTaskDialog).toHaveBeenCalledTimes(1);
    const scopeControls = within(screen.getByRole("group", { name: /checklist scope filters/i })).getAllByRole("button");
    const statusControls = within(screen.getByRole("group", { name: /checklist status filters/i })).getAllByRole("button");
    expect(scopeControls).toHaveLength(3);
    expect(statusControls).toHaveLength(3);
    await user.click(within(screen.getByRole("group", { name: /checklist scope filters/i })).getByRole("button", { name: /all/i }));
    expect(setTaskScopeFilter).toHaveBeenCalled();
    await user.click(within(screen.getByRole("group", { name: /checklist status filters/i })).getByRole("button", { name: /done/i }));
    expect(setTaskStatusFilter).toHaveBeenCalled();
  });
});

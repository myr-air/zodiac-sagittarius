import { OverviewPage } from "@/src/features/itinerary/components";
import { noop } from "@/src/testing/storybook-actions";
import { tripFixture } from "@/src/trip/testing/fixtures/trip-fixtures";
import type { AppShellProps } from "@/src/features/workspace/components/app-shell";

type AppShellStoryArgs = AppShellProps;

const workspaceShellClassName = "workspace-shell min-w-0 bg-transparent";
const workspaceGridClassName = "workspace-grid relative grid h-[calc(100vh-62px)] min-h-0 grid-cols-[minmax(0,1fr)] overflow-hidden data-[command-bar=hidden]:h-screen max-[1199px]:h-auto max-[1199px]:grid-cols-1 max-[1199px]:overflow-visible";
const planningMainClassName = "planning-main h-full min-h-0 min-w-0 overflow-y-auto scroll-smooth bg-(--color-page) max-[1199px]:h-auto max-[1199px]:overflow-y-visible";

function buildOverviewPage() {
  return (
    <OverviewPage
      trip={tripFixture.trip}
      currentMemberId={tripFixture.currentMembers.owner.id}
      expenseSummary={tripFixture.expenseSummaries.owner}
      items={tripFixture.planItems}
      suggestions={tripFixture.suggestions}
      tasks={tripFixture.tasks}
      onCreateTask={noop}
      onOpenExpenses={noop}
      onToggleTaskStatus={noop}
    />
  );
}

export function buildAppShellStoryArgs(
  overrides: Partial<AppShellStoryArgs> = {},
): AppShellStoryArgs {
  return {
    activeView: "overview",
    collapsed: false,
    currentMember: tripFixture.currentMembers.owner,
    trip: tripFixture.trip,
    onToggleCollapsed: noop,
    children: (
      <main className={workspaceShellClassName}>
        <div className={workspaceGridClassName} data-context-rail="closed" data-command-bar="hidden">
          <div className={planningMainClassName}>{buildOverviewPage()}</div>
        </div>
      </main>
    ),
    ...overrides,
  };
}

export const appShellOwnerStoryArgs = buildAppShellStoryArgs();
export const appShellTravelerStoryArgs = buildAppShellStoryArgs({
  currentMember: tripFixture.currentMembers.traveler,
});
export const appShellViewerStoryArgs = buildAppShellStoryArgs({
  currentMember: tripFixture.currentMembers.viewer,
});
export const collapsedAppShellOwnerStoryArgs = buildAppShellStoryArgs({
  collapsed: true,
});

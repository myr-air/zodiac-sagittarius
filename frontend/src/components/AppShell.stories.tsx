import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { tripFixture } from "@/src/trip/trip-fixtures";
import { AppShell } from "./AppShell";
import { OverviewPage } from "./OverviewPage";

const meta = {
  title: "Templates/Workspace Shell",
  component: AppShell,
  parameters: { layout: "fullscreen" },
  tags: ["ai-generated"],
} satisfies Meta<typeof AppShell>;

export default meta;

type Story = StoryObj<typeof meta>;
const workspaceShellClassName = "workspace-shell min-w-0 bg-transparent";
const workspaceGridClassName = "workspace-grid relative grid h-[calc(100vh-62px)] min-h-0 grid-cols-[minmax(0,1fr)] overflow-hidden data-[command-bar=hidden]:h-screen max-[1199px]:h-auto max-[1199px]:grid-cols-1 max-[1199px]:overflow-visible";
const planningMainClassName = "planning-main h-full min-h-0 min-w-0 overflow-y-auto scroll-smooth bg-(--color-page) max-[1199px]:h-auto max-[1199px]:overflow-y-visible";

export const Owner: Story = {
  args: {
    activeView: "overview",
    collapsed: false,
    currentMember: tripFixture.currentMembers.owner,
    trip: tripFixture.trip,
    onToggleCollapsed: () => {},
    children: (
      <main className={workspaceShellClassName}>
        <div className={workspaceGridClassName} data-context-rail="closed" data-command-bar="hidden">
          <div className={planningMainClassName}>
            <OverviewPage
              trip={tripFixture.trip}
              currentMemberId={tripFixture.currentMembers.owner.id}
              expenseSummary={tripFixture.expenseSummaries.owner}
              items={tripFixture.planItems}
              suggestions={tripFixture.suggestions}
              tasks={tripFixture.tasks}
              onCreateTask={() => {}}
              onOpenExpenses={() => {}}
              onToggleTaskStatus={() => {}}
            />
          </div>
        </div>
      </main>
    ),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("link", { name: /Overview/i })).toHaveAttribute("aria-current", "page");
  },
};

export const Mobile: Story = { args: { ...Owner.args, collapsed: true } };

export const OwnerThai: Story = {
  args: Owner.args,
  parameters: { locale: "th" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("navigation", { name: /เมนูวางแผน Joii/i })).toBeVisible();
    await expect(canvas.getByRole("link", { name: /ภาพรวม/i })).toHaveAttribute("aria-current", "page");
  },
};

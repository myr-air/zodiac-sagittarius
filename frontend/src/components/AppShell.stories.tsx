import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { tripFixture } from "@/src/trip/fixtures";
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

export const Owner: Story = {
  args: {
    activeView: "overview",
    collapsed: false,
    currentMember: tripFixture.currentMembers.owner,
    trip: tripFixture.trip,
    onToggleCollapsed: () => {},
    children: (
      <main className="workspace-shell">
        <div className="workspace-grid" data-context-rail="closed" data-command-bar="hidden">
          <div className="planning-main">
            <OverviewPage
              trip={tripFixture.trip}
              currentMemberId={tripFixture.currentMembers.owner.id}
              expenseSummary={tripFixture.expenseSummaries.owner}
              items={tripFixture.planItems}
              suggestions={tripFixture.suggestions}
              tasks={tripFixture.tasks}
              onCreateTask={() => {}}
              onToggleTaskStatus={() => {}}
            />
          </div>
        </div>
      </main>
    ),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("link", { name: /ภาพรวม/i })).toHaveAttribute("aria-current", "page");
  },
};

export const Mobile: Story = { args: { ...Owner.args, collapsed: true } };

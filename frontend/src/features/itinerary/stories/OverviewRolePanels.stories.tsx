import { expect } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  ManagerOverviewPanels,
  TravelerOverviewPanels,
  ViewerOverviewPanels,
} from "@/src/features/itinerary/components/overview";
import {
  managerOverviewPanelStoryProps,
  travelerOverviewPanelStoryProps,
  viewerOverviewPanelStoryProps,
} from "./OverviewRolePanels.stories.support";

const meta = {
  title: "Components/Overview/Role Panels",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Traveler: Story = {
  render: () => (
    <div className="p-4 bg-(--color-page)">
      <TravelerOverviewPanels
        {...travelerOverviewPanelStoryProps}
      />
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("region", { name: /traveler highlights/i })).toBeInTheDocument();
    await expect(canvas.getByRole("region", { name: /my travel checklist/i })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: /^add$/i })).toBeInTheDocument();
  },
};

export const Viewer: Story = {
  render: () => (
    <div className="p-4 bg-(--color-page)">
      <ViewerOverviewPanels
        {...viewerOverviewPanelStoryProps}
      />
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("region", { name: /read-only trip snapshot/i })).toBeInTheDocument();
    await expect(canvas.getByRole("region", { name: /next important stop/i })).toBeInTheDocument();
    await expect(canvas.queryByRole("button", { name: /add checklist item/i })).toBeNull();
  },
};

export const Manager: Story = {
  render: () => (
    <div className="p-4 bg-(--color-page)">
      <ManagerOverviewPanels
        {...managerOverviewPanelStoryProps}
      />
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("region", { name: /trip readiness/i })).toBeInTheDocument();
    await expect(canvas.getByRole("region", { name: /trip checklist/i })).toBeInTheDocument();
    await expect(canvas.getByRole("group", { name: /checklist scope/i })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: /add checklist item/i })).toBeInTheDocument();
  },
};

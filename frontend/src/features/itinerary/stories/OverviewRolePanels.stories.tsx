import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  ManagerOverviewPanels,
  TravelerOverviewPanels,
  ViewerOverviewPanels,
} from "@/src/features/itinerary/components/overview";
import { managerPlay, travelerPlay, viewerPlay } from "./OverviewRolePanels.stories.plays";
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
  play: travelerPlay,
};

export const Viewer: Story = {
  render: () => (
    <div className="p-4 bg-(--color-page)">
      <ViewerOverviewPanels
        {...viewerOverviewPanelStoryProps}
      />
    </div>
  ),
  play: viewerPlay,
};

export const Manager: Story = {
  render: () => (
    <div className="p-4 bg-(--color-page)">
      <ManagerOverviewPanels
        {...managerOverviewPanelStoryProps}
      />
    </div>
  ),
  play: managerPlay,
};

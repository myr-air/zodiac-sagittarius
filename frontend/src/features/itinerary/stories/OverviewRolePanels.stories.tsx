import type { ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ManagerOverviewPanels } from "@/src/features/itinerary/components/overview/ManagerOverviewPanels";
import { TravelerOverviewPanels } from "@/src/features/itinerary/components/overview/TravelerOverviewPanels";
import { ViewerOverviewPanels } from "@/src/features/itinerary/components/overview/ViewerOverviewPanels";
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

function OverviewRolePanelStoryFrame({ children }: { children: ReactNode }) {
  return <div className="p-4 bg-(--color-page)">{children}</div>;
}

export const Traveler: Story = {
  render: () => (
    <OverviewRolePanelStoryFrame>
      <TravelerOverviewPanels
        {...travelerOverviewPanelStoryProps}
      />
    </OverviewRolePanelStoryFrame>
  ),
  play: travelerPlay,
};

export const Viewer: Story = {
  render: () => (
    <OverviewRolePanelStoryFrame>
      <ViewerOverviewPanels
        {...viewerOverviewPanelStoryProps}
      />
    </OverviewRolePanelStoryFrame>
  ),
  play: viewerPlay,
};

export const Manager: Story = {
  render: () => (
    <OverviewRolePanelStoryFrame>
      <ManagerOverviewPanels
        {...managerOverviewPanelStoryProps}
      />
    </OverviewRolePanelStoryFrame>
  ),
  play: managerPlay,
};

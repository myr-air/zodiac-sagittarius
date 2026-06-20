import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RouteMapView } from "@/src/features/itinerary/components";
import {
  denseMapItems,
  emptyMapItems,
  mapOwnerStoryArgs,
} from "./MapPage.stories.support";
import { ownerThaiPlay } from "./MapTemplate.stories.plays";

const meta = {
  title: "Templates/Map",
  component: RouteMapView,
  parameters: { layout: "fullscreen" },
  tags: ["ai-generated"],
} satisfies Meta<typeof RouteMapView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Owner: Story = {
  args: mapOwnerStoryArgs,
};

export const OwnerThai: Story = {
  args: Owner.args,
  parameters: { locale: "th" },
  play: ownerThaiPlay,
};

export const Traveler: Story = { args: Owner.args };

export const Viewer: Story = { args: Owner.args };

export const Dense: Story = { args: { ...Owner.args, items: denseMapItems } };

export const Empty: Story = { args: { ...Owner.args, items: emptyMapItems } };

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RouteMapView } from "@/src/features/itinerary/components";
import {
  denseMapItems,
  emptyMapItems,
  mapOwnerStoryArgs,
} from "./MapPage.stories.support";
import { ownerThaiPlay } from "./MapTemplate.stories.plays";
import { ownerArgsStory } from "@/src/shared/storybook/story-builders";

const meta = {
  title: "Templates/Map",
  component: RouteMapView,
  parameters: { layout: "fullscreen" },
  tags: ["ai-generated"],
} satisfies Meta<typeof RouteMapView>;

export default meta;

type Story = StoryObj<typeof meta>;
const ownerStory = ownerArgsStory<Story>;

export const Owner: Story = {
  args: mapOwnerStoryArgs,
};

export const OwnerThai: Story = {
  args: Owner.args,
  parameters: { locale: "th" },
  play: ownerThaiPlay,
};

export const Traveler: Story = ownerStory(Owner.args, {});

export const Viewer: Story = ownerStory(Owner.args, {});

export const Dense: Story = ownerStory(Owner.args, { items: denseMapItems });

export const Empty: Story = ownerStory(Owner.args, { items: emptyMapItems });

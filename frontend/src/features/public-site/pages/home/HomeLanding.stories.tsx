import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  argsStory,
  viewportStory,
} from "@/src/shared/storybook/story-builders";
import { HomeLanding } from "./HomeLanding";
import {
  compactHeroPlay,
  desktop1440Play,
  mobilePlay,
  pixelPerfectPlay,
  thaiPlay,
} from "./HomeLanding.stories.plays";
import { appRoutes } from "@/src/trip/workspace/sagittarius-app/support";

const meta = {
  title: "Pages/Home Landing",
  component: HomeLanding,
  parameters: {
    layout: "fullscreen",
    nextjs: { navigation: { pathname: appRoutes.home() } },
  },
} satisfies Meta<typeof HomeLanding>;

export default meta;

type Story = StoryObj<typeof meta>;
const landingStory = argsStory<Story>;
const viewportStoryForLanding = viewportStory<Story>;

export const PixelPerfect: Story = {
  play: pixelPerfectPlay,
};

export const Thai: Story = landingStory({}, {}, thaiPlay, { locale: "th" });

export const Tablet: Story = viewportStoryForLanding({}, "tablet768", compactHeroPlay);

export const Desktop1024: Story = viewportStoryForLanding(
  {},
  "desktop1024",
  compactHeroPlay,
);

export const Desktop1440: Story = viewportStoryForLanding(
  {},
  "desktop1440",
  desktop1440Play,
);

export const Mobile: Story = viewportStoryForLanding({}, "mobile320", mobilePlay);

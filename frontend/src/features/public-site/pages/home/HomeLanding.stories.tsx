import type { Meta, StoryObj } from "@storybook/nextjs-vite";
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

export const PixelPerfect: Story = {
  play: pixelPerfectPlay,
};

export const Thai: Story = {
  parameters: { locale: "th" },
  play: thaiPlay,
};

export const Tablet: Story = {
  parameters: {
    viewport: { defaultViewport: "tablet768" },
  },
  play: compactHeroPlay,
};

export const Desktop1024: Story = {
  parameters: {
    viewport: { defaultViewport: "desktop1024" },
  },
  play: compactHeroPlay,
};

export const Desktop1440: Story = {
  parameters: {
    viewport: { defaultViewport: "desktop1440" },
  },
  play: desktop1440Play,
};

export const Mobile: Story = {
  parameters: {
    viewport: { defaultViewport: "mobile320" },
  },
  play: mobilePlay,
};

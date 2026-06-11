import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { HomeLanding } from "./HomeLanding";

const meta = {
  title: "Pages/Home Landing",
  component: HomeLanding,
  parameters: {
    layout: "fullscreen",
    nextjs: { navigation: { pathname: "/" } },
  },
} satisfies Meta<typeof HomeLanding>;

export default meta;

type Story = StoryObj<typeof meta>;

export const PixelPerfect: Story = {};

export const Mobile: Story = {
  parameters: {
    viewport: { defaultViewport: "mobile320" },
  },
};

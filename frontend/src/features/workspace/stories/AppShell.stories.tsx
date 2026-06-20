import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { AppShell } from "@/src/features/workspace/components/app-shell";
import {
  appShellOwnerStoryArgs,
  appShellTravelerStoryArgs,
  appShellViewerStoryArgs,
  collapsedAppShellOwnerStoryArgs,
} from "./AppShell.stories.support";

const meta = {
  title: "Templates/Workspace Shell",
  component: AppShell,
  parameters: { layout: "fullscreen" },
  tags: ["ai-generated"],
} satisfies Meta<typeof AppShell>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Owner: Story = {
  args: appShellOwnerStoryArgs,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("link", { name: /Overview/i })).toHaveAttribute("aria-current", "page");
  },
};

export const Traveler: Story = {
  args: appShellTravelerStoryArgs,
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Explorer Friend")).toBeVisible();
    await expect(canvas.getAllByText("Traveler").length).toBeGreaterThan(0);
  },
};

export const Viewer: Story = {
  args: appShellViewerStoryArgs,
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Family Member")).toBeVisible();
    await expect(canvas.getByText("Viewer")).toBeVisible();
  },
};

export const Mobile: Story = {
  args: collapsedAppShellOwnerStoryArgs,
  parameters: { viewport: { defaultViewport: "mobile320" } },
};

export const Tablet: Story = {
  args: collapsedAppShellOwnerStoryArgs,
  parameters: { viewport: { defaultViewport: "tablet768" } },
};

export const OwnerThai: Story = {
  args: Owner.args,
  parameters: { locale: "th" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("navigation", { name: /เมนูวางแผน Joii/i })).toBeVisible();
    await expect(canvas.getByRole("link", { name: /ภาพรวม/i })).toHaveAttribute("aria-current", "page");
  },
};

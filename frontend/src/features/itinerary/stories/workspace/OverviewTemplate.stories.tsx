import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { OverviewPage } from "@/src/features/itinerary/components";
import {
  overviewTemplateDenseStoryArgs,
  overviewTemplateEmptyStoryArgs,
  overviewTemplateOwnerStoryArgs,
  overviewTemplateTravelerStoryArgs,
  overviewTemplateViewerStoryArgs,
} from "../OverviewPage.stories.support";

const meta = {
  title: "Templates/Overview",
  component: OverviewPage,
  parameters: { layout: "fullscreen" },
  tags: ["ai-generated"],
} satisfies Meta<typeof OverviewPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Owner: Story = {
  args: overviewTemplateOwnerStoryArgs,
};

export const Traveler: Story = {
  args: overviewTemplateTravelerStoryArgs,
};

export const OwnerThai: Story = {
  args: Owner.args,
  parameters: { locale: "th" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("region", { name: /Hong Kong \+ Shenzhen Trip/i })).toBeVisible();
    await expect(canvas.getByRole("region", { name: /travel cockpit/i })).toBeVisible();
    await expect(canvas.getByRole("region", { name: /ไฮไลต์ทริป/i })).toBeVisible();
    await expect(canvas.getByRole("region", { name: /เช็กลิสต์ของทริป/i })).toBeVisible();
    await expect(canvas.getByRole("region", { name: /Trip overview/i })).toHaveClass("grid");
    await expect(canvas.getByRole("region", { name: /Hong Kong \+ Shenzhen Trip/i })).toHaveClass("overview-hero", "grid");
    await expect(canvas.getByRole("region", { name: /travel cockpit/i })).toHaveClass("overview-travel-cockpit", "grid", "grid-cols-3");
  },
};

export const Viewer: Story = {
  args: overviewTemplateViewerStoryArgs,
};

export const Empty: Story = {
  args: overviewTemplateEmptyStoryArgs,
};

export const Dense: Story = {
  args: overviewTemplateDenseStoryArgs,
};

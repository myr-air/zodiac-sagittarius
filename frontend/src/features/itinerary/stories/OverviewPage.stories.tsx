import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent } from "storybook/test";
import { OverviewPage } from "@/src/features/itinerary/components";
import {
  expectOverviewStructure,
  overviewPageDenseStoryArgs,
  overviewPageEmptyStoryArgs,
  overviewPageOwnerStoryArgs,
  overviewPageTravelerStoryArgs,
  overviewPageViewerStoryArgs,
} from "./OverviewPage.stories.support";

const meta = {
  title: "Pages/Overview",
  component: OverviewPage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof OverviewPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Owner: Story = {
  args: overviewPageOwnerStoryArgs,
  play: async ({ canvas, canvasElement }) => {
    await expectOverviewStructure(canvasElement);
    await expect(canvas.getByRole("region", { name: /Trip readiness/i })).toBeVisible();
    await expect(canvas.getByRole("region", { name: /Trip checklist/i })).toBeVisible();
    await expect(canvas.getByRole("button", { name: /Add checklist item/i })).toBeVisible();
    await expect(canvas.getByRole("group", { name: /Checklist scope/i })).toBeVisible();
  },
};

export const OwnerThai: Story = {
  args: Owner.args,
  parameters: { locale: "th" },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("ศูนย์จัดการทริป")).toBeVisible();
    await expect(canvas.getByRole("region", { name: /เช็กลิสต์ของทริป/i })).toBeVisible();
    await expect(canvas.getByRole("button", { name: /เพิ่มเช็กลิสต์/i })).toBeVisible();
  },
};

export const Traveler: Story = {
  args: overviewPageTravelerStoryArgs,
  play: async ({ canvas, canvasElement }) => {
    await expectOverviewStructure(canvasElement);
    await expect(canvas.getByRole("region", { name: /Today and next focus/i })).toBeVisible();
    await expect(canvas.getByRole("region", { name: /Traveler highlights/i })).toBeVisible();
    await expect(canvas.getByRole("region", { name: /My travel checklist/i })).toBeVisible();
    await expect(canvas.getByPlaceholderText(/For example, pack a travel adapter/i)).toBeVisible();
    await expect(canvas.queryByRole("region", { name: /Trip readiness/i })).toBeNull();
  },
};

export const Viewer: Story = {
  args: overviewPageViewerStoryArgs,
  play: async ({ canvas, canvasElement }) => {
    await expectOverviewStructure(canvasElement);
    await expect(canvas.getByRole("region", { name: /Read-only trip snapshot/i })).toBeVisible();
    await expect(canvas.getByRole("region", { name: /Next important stop/i })).toBeVisible();
    await expect(canvas.queryByRole("textbox")).toBeNull();
    await expect(canvas.queryByRole("button", { name: /Add checklist item/i })).toBeNull();
  },
};

export const Dense: Story = {
  args: overviewPageDenseStoryArgs,
  play: async ({ canvasElement }) => {
    await expectOverviewStructure(canvasElement);
    await expect(canvasElement.querySelectorAll(".overview-highlight-item").length).toBeGreaterThan(2);
    await expect(canvasElement.querySelectorAll(".overview-panel").length).toBeGreaterThan(2);
  },
};

export const Empty: Story = {
  args: overviewPageEmptyStoryArgs,
  play: async ({ canvas, canvasElement }) => {
    await expectOverviewStructure(canvasElement);
    await expect(canvas.getByText(/No itinerary yet/i)).toBeVisible();
    await expect(canvasElement.querySelectorAll(".overview-task-item").length).toBe(0);
  },
};

export const AddTaskDialogOpen: Story = {
  args: Owner.args,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: /Add checklist/i }));
    await expect(canvas.getByRole("dialog", { name: /Add checklist/i })).toBeVisible();
    await expect(canvas.getByPlaceholderText(/For example, book dinner/i)).toBeVisible();
    await expect(canvas.getByText("Keep it in")).toBeVisible();
    await expect(canvas.getAllByRole("button", { name: /Add checklist item/i })[1]).toBeDisabled();
  },
};

export const Tablet: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "tablet768" } },
  play: async ({ canvasElement }) => {
    await expectOverviewStructure(canvasElement);
    await expect(canvasElement.querySelector(".overview-grid")).toHaveClass("max-[1199px]:grid-cols-1");
  },
};

export const Desktop1024: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "desktop1024" } },
  play: async ({ canvasElement }) => {
    await expectOverviewStructure(canvasElement);
    await expect(canvasElement.querySelector(".overview-grid")).toHaveClass("max-[1199px]:grid-cols-1");
  },
};

export const Desktop1440: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "desktop1440" } },
  play: async ({ canvasElement }) => {
    await expectOverviewStructure(canvasElement);
    await expect(canvasElement.querySelector(".overview-travel-cockpit")).toHaveClass("grid-cols-3");
  },
};

export const Mobile: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "mobile320" } },
  play: async ({ canvasElement }) => {
    await expectOverviewStructure(canvasElement);
    await expect(canvasElement.querySelector(".overview-hero")).toHaveClass("max-[1199px]:grid-cols-1");
    await expect(canvasElement.querySelector(".overview-highlight-list")).toHaveClass("max-[767px]:flex", "max-[767px]:overflow-x-auto");
  },
};

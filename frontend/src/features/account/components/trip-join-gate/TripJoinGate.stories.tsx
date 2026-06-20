import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { TripJoinGate } from "./TripJoinGate";
import {
  expectJoinResponsiveContract,
  roomCredentialsStoryArgs,
  selectIdentityStoryArgs,
  tripAccessStoryArgs,
} from "./TripJoinGate.stories.support";

const meta = {
  title: "Pages/Trip Join Gate",
  component: TripJoinGate,
  parameters: { layout: "fullscreen" },
  tags: ["ai-generated"],
} satisfies Meta<typeof TripJoinGate>;

export default meta;

type Story = StoryObj<typeof meta>;

export const RoomCredentials: Story = {
  args: roomCredentialsStoryArgs,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("heading", { name: /Enter trip room/i })).toBeVisible();
    await expect(canvas.getByLabelText(/Trip ID/i)).toHaveValue("HK-SZ-2025");
    await expect(canvas.getByRole("main", { name: /Join trip/i })).toHaveClass("join-page", "bg-(--color-page)");
  },
};

export const TripAccess: Story = {
  args: tripAccessStoryArgs,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("main", { name: /Join trip/i })).toBeVisible();
    await expect(canvas.getByLabelText(/Trip access preview/i)).toHaveClass(
      "trip-access-visual",
      "bg-(--color-surface-subtle)",
    );
    await expect(canvas.getByRole("heading", { name: /Enter trip room/i })).toBeVisible();
  },
};

export const SelectIdentity: Story = {
  args: selectIdentityStoryArgs,
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("heading", { name: /Choose identity/i })).toBeVisible();
    const memberList = canvas.getByRole("group", { name: /Trip member list/i });
    await expect(memberList).toBeVisible();
    await canvas.getByRole("button", { name: /Travel Mate/i }).click();
    await expect(canvas.getByRole("form", { name: /Travel Mate/i })).toBeVisible();
    await expect(canvas.getByLabelText(/Set password for Travel Mate/i)).toBeVisible();
    await expect(canvas.getByRole("button", { name: /Show participant password/i })).toBeVisible();
  },
};

export const Thai: Story = {
  args: RoomCredentials.args,
  parameters: { locale: "th" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("heading", { name: /เข้าห้อง trip/i })).toBeVisible();
    await expect(canvas.getByLabelText(/Trip ID/i)).toHaveValue("HK-SZ-2025");
    await expect(canvas.getByRole("button", { name: /เข้าห้อง trip/i })).toBeVisible();
  },
};

export const Mobile: Story = {
  args: SelectIdentity.args,
  parameters: { viewport: { defaultViewport: "mobile320" } },
  play: async ({ canvas, canvasElement }) => {
    await expect(await canvas.findByRole("heading", { name: /Choose identity/i })).toBeVisible();
    await expectJoinResponsiveContract(canvasElement);
    await expect(canvas.getByRole("main", { name: /Join trip/i })).toBeVisible();
  },
};

export const Tablet: Story = {
  args: SelectIdentity.args,
  parameters: { viewport: { defaultViewport: "tablet768" } },
  play: async ({ canvas, canvasElement }) => {
    await expect(await canvas.findByRole("heading", { name: /Choose identity/i })).toBeVisible();
    await expectJoinResponsiveContract(canvasElement);
  },
};

export const Desktop1024: Story = {
  args: SelectIdentity.args,
  parameters: { viewport: { defaultViewport: "desktop1024" } },
  play: async ({ canvas, canvasElement }) => {
    await expect(await canvas.findByRole("heading", { name: /Choose identity/i })).toBeVisible();
    await expectJoinResponsiveContract(canvasElement);
  },
};

export const Desktop1440: Story = {
  args: TripAccess.args,
  parameters: { viewport: { defaultViewport: "desktop1440" } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("main", { name: /Join trip/i })).toBeVisible();
    await expect(canvas.getByLabelText(/Trip access preview/i)).toHaveClass("trip-access-visual");
    await expect(canvas.getByRole("heading", { name: /Enter trip room/i })).toBeVisible();
  },
};

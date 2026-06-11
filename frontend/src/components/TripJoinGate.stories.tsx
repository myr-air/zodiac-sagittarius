import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { seedTrip } from "@/src/trip/seed";
import { TripJoinGate } from "./TripJoinGate";

const noop = () => {};

const meta = {
  title: "Pages/Trip Join Gate",
  component: TripJoinGate,
  parameters: { layout: "fullscreen" },
  tags: ["ai-generated"],
} satisfies Meta<typeof TripJoinGate>;

export default meta;

type Story = StoryObj<typeof meta>;

export const RoomCredentials: Story = {
  args: {
    trip: seedTrip,
    initialJoinCode: "HK-SZ-2025",
    onTripChange: noop,
    onAuthenticated: noop,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("heading", { name: /Enter trip room/i })).toBeVisible();
    await expect(canvas.getByLabelText(/Trip ID/i)).toHaveValue("HK-SZ-2025");
    await expect(canvas.getByRole("main", { name: /Join trip/i })).toHaveClass("join-page", "bg-(--color-page)");
  },
};

export const TripAccess: Story = {
  args: {
    ...RoomCredentials.args,
    variant: "trip-access",
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("main", { name: /Join trip/i })).toBeVisible();
    await expect(canvas.getByLabelText(/Trip access preview/i)).toHaveClass(
      "trip-access-visual",
      "bg-(--color-surface-subtle)",
    );
    await expect(canvas.getByRole("heading", { name: /Enter trip room/i })).toBeVisible();
  },
};

export const Thai: Story = {
  args: RoomCredentials.args,
  parameters: { locale: "th" },
};

export const Mobile: Story = {
  args: RoomCredentials.args,
  parameters: { viewport: { defaultViewport: "mobile320" } },
};

export const Tablet: Story = {
  args: RoomCredentials.args,
  parameters: { viewport: { defaultViewport: "tablet768" } },
};

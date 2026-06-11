import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import type { TripApiClient } from "@/src/trip/api-client";
import { seedTrip } from "@/src/trip/seed";
import { TripJoinGate } from "./TripJoinGate";

const noop = () => {};
const inviteTokenApiClient = {
  resolveJoinInviteToken: async () => ({
    trip: {
      id: seedTrip.id,
      name: seedTrip.name,
      destinationLabel: seedTrip.destinationLabel,
      startDate: seedTrip.startDate,
      endDate: seedTrip.endDate,
      joinId: seedTrip.joinId,
      activePlanVariantId: seedTrip.activePlanVariantId,
      ownerMemberId: seedTrip.members[0]?.id ?? "",
      version: seedTrip.version,
    },
    claimableMembers: seedTrip.members.map((member) => ({
      id: member.id,
      tripId: seedTrip.id,
      displayName: member.displayName,
      role: member.role,
      accessStatus: member.accessStatus ?? "active",
      presence: member.presence,
      color: member.color,
      userId: member.userId ?? null,
      claimedAt: member.claimedAt ?? null,
      lastSeenAt: member.lastSeenAt ?? null,
    })),
    joinSessionToken: "storybook-join-session",
    expiresAt: "2026-06-28T00:00:00.000Z",
  }),
} as unknown as TripApiClient;

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

export const SelectIdentity: Story = {
  args: {
    ...RoomCredentials.args,
    apiClient: inviteTokenApiClient,
    initialJoinToken: "storybook-invite-token",
    variant: "trip-access",
  },
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
};

export const Mobile: Story = {
  args: RoomCredentials.args,
  parameters: { viewport: { defaultViewport: "mobile320" } },
};

export const Tablet: Story = {
  args: RoomCredentials.args,
  parameters: { viewport: { defaultViewport: "tablet768" } },
};

import { expectStoryElementClasses } from "@/src/shared/storybook/story-assertions";
import { noop } from "@/src/testing/storybook-actions";
import type { TripApiClient } from "@/src/trip/api-client";
import { seedTrip } from "@/src/trip/seed";
import type { TripJoinGateProps } from "../TripJoinGate";

type TripJoinGateStoryArgs = TripJoinGateProps;

export const inviteTokenApiClient = {
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

export const roomCredentialsStoryArgs = {
  trip: seedTrip,
  initialJoinCode: "HK-SZ-2025",
  onTripChange: noop,
  onAuthenticated: noop,
} satisfies TripJoinGateStoryArgs;

export const tripAccessStoryArgs = {
  ...roomCredentialsStoryArgs,
  variant: "trip-access",
} satisfies TripJoinGateStoryArgs;

export const selectIdentityStoryArgs = {
  ...roomCredentialsStoryArgs,
  apiClient: inviteTokenApiClient,
  initialJoinToken: "storybook-invite-token",
  variant: "trip-access",
} satisfies TripJoinGateStoryArgs;

export async function expectJoinResponsiveContract(canvasElement: HTMLElement) {
  await expectStoryElementClasses(canvasElement, ".participant-grid", "participant-grid", "max-[767px]:grid-cols-1");
  await expectStoryElementClasses(
    canvasElement,
    ".trip-access-photo-stack",
    "trip-access-photo-stack",
    "relative",
    "z-[1]",
    "min-h-[380px]",
    "max-[767px]:min-h-[200px]",
  );
}

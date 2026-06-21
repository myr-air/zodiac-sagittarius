import { expect, within } from "storybook/test";
import { noop } from "@/src/testing/storybook-actions";
import { buildDenseTripFixture, tripFixture } from "@/src/trip/trip-fixtures";
import type { TripMembersPage } from "../TripMembersPage";

type MembersPageStoryArgs = Parameters<typeof TripMembersPage>[0];

const denseMembersTrip = buildDenseTripFixture();

const singleMemberTrip = {
  ...tripFixture.trip,
  members: [tripFixture.currentMembers.owner],
};

export const membersOwnerStoryArgs = {
  trip: tripFixture.trip,
  currentMember: tripFixture.currentMembers.owner,
  canManagePeople: true,
  onChangeMemberAccessStatus: noop,
  onChangeMemberPassword: noop,
  onChangeMemberRole: noop,
  onCreateMember: noop,
  onResetMemberClaim: noop,
} satisfies MembersPageStoryArgs;

export const membersTravelerStoryArgs = {
  ...membersOwnerStoryArgs,
  currentMember: tripFixture.currentMembers.traveler,
  canManagePeople: false,
} satisfies MembersPageStoryArgs;

export const membersViewerStoryArgs = {
  ...membersOwnerStoryArgs,
  currentMember: tripFixture.currentMembers.viewer,
  canManagePeople: false,
} satisfies MembersPageStoryArgs;

export const membersDenseStoryArgs = {
  ...membersOwnerStoryArgs,
  trip: denseMembersTrip,
  currentMember: denseMembersTrip.members.find((member) => member.role === "owner") ?? tripFixture.currentMembers.owner,
} satisfies MembersPageStoryArgs;

export const membersEmptyStoryArgs = {
  ...membersOwnerStoryArgs,
  trip: singleMemberTrip,
  currentMember: tripFixture.currentMembers.owner,
} satisfies MembersPageStoryArgs;

export async function expectMembersResponsiveContract(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  await expect(canvas.getByRole("region", { name: /Trip members|สมาชิกทริป/i })).toHaveClass("members-page");
  await expect(canvas.getByRole("region", { name: /Member summary|สรุปสมาชิก/i })).toHaveClass("member-stat-grid");
}

import { expect, within } from "storybook/test";
import { noop } from "@/src/testing/storybook-actions";
import { buildDenseTripFixture, tripFixture } from "@/src/trip/trip-fixtures";
import type { TripMembersPage } from "./TripMembersPage";

type MembersPageStoryArgs = Parameters<typeof TripMembersPage>[0];

export const denseMembersTrip = buildDenseTripFixture();

export const singleMemberTrip = {
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

export async function expectMembersResponsiveContract(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  await expect(canvas.getByRole("region", { name: /Trip members|สมาชิกทริป/i })).toHaveClass("members-page");
  await expect(canvas.getByRole("region", { name: /Member summary|สรุปสมาชิก/i })).toHaveClass("member-stat-grid");
}

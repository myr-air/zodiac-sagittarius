import { expect, within } from "storybook/test";
import { noop } from "@/src/testing/storybook-actions";
import {
  denseStoryTrip,
  ownerStoryMember,
  singleMemberStoryTrip,
  storyTrip,
  travelerStoryMember,
  viewerStoryMember,
} from "@/src/trip/testing/fixtures/trip-story-fixtures";
import type { TripMembersPageProps } from "../TripMembersPage";

type MembersPageStoryArgs = TripMembersPageProps;

export const membersOwnerStoryArgs = {
  trip: storyTrip,
  currentMember: ownerStoryMember,
  canManagePeople: true,
  onChangeMemberAccessStatus: noop,
  onChangeMemberPassword: noop,
  onChangeMemberRole: noop,
  onCreateMember: noop,
  onResetMemberClaim: noop,
} satisfies MembersPageStoryArgs;

export const membersTravelerStoryArgs = {
  ...membersOwnerStoryArgs,
  currentMember: travelerStoryMember,
  canManagePeople: false,
} satisfies MembersPageStoryArgs;

export const membersViewerStoryArgs = {
  ...membersOwnerStoryArgs,
  currentMember: viewerStoryMember,
  canManagePeople: false,
} satisfies MembersPageStoryArgs;

export const membersDenseStoryArgs = {
  ...membersOwnerStoryArgs,
  trip: denseStoryTrip,
  currentMember: denseStoryTrip.members.find((member) => member.role === "owner") ?? ownerStoryMember,
} satisfies MembersPageStoryArgs;

export const membersEmptyStoryArgs = {
  ...membersOwnerStoryArgs,
  trip: singleMemberStoryTrip,
  currentMember: ownerStoryMember,
} satisfies MembersPageStoryArgs;

export async function expectMembersResponsiveContract(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  await expect(canvas.getByRole("region", { name: /Trip members|สมาชิกทริป/i })).toHaveClass("members-page");
  await expect(canvas.getByRole("region", { name: /Member summary|สรุปสมาชิก/i })).toHaveClass("member-stat-grid", "max-[767px]:flex", "max-[767px]:overflow-x-auto");
  await expect(canvasElement.querySelector(".member-command-meta")).toHaveClass("max-[767px]:p-2");
}

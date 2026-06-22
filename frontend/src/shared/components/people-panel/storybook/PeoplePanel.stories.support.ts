import { noop } from "@/src/testing/storybook-actions";
import { seedTrip } from "@/src/trip/seed";
import type { PeoplePanelProps } from "../people-panel.types";

type PeoplePanelStoryArgs = PeoplePanelProps;

export const managerPeoplePanelStoryArgs = {
  members: seedTrip.members.filter((member) => member.id !== "member-viewer"),
  currentMemberId: "member-aom",
  canManagePeople: true,
  onChangeMemberAccessStatus: noop,
  onChangeCurrentMemberPassword: noop,
  onChangeMemberRole: noop,
  onResetMemberClaim: noop,
} satisfies PeoplePanelStoryArgs;

export const readOnlyPeoplePanelStoryArgs = {
  ...managerPeoplePanelStoryArgs,
  currentMemberId: "member-nam",
  canManagePeople: false,
} satisfies PeoplePanelStoryArgs;

export const emptyPeoplePanelStoryArgs = {
  members: [],
  currentMemberId: "member-aom",
  emptyMessage: "ไม่มีสมาชิกในตัวกรองนี้",
  onResetFilters: noop,
} satisfies PeoplePanelStoryArgs;

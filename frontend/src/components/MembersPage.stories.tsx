import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { tripFixture } from "@/src/trip/trip-fixtures";
import { TripMembersPage } from "./TripMembersPage";

const noop = () => {};

const meta = {
  title: "Pages/Members",
  component: TripMembersPage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof TripMembersPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Owner: Story = {
  args: {
    trip: tripFixture.trip,
    currentMember: tripFixture.currentMembers.owner,
    canManagePeople: true,
    onChangeMemberAccessStatus: noop,
    onChangeMemberPassword: noop,
    onChangeMemberRole: noop,
    onCreateMember: noop,
    onResetMemberClaim: noop,
  },
};

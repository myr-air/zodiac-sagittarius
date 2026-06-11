import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { buildDenseTripFixture, tripFixture } from "@/src/trip/trip-fixtures";
import { TripMembersPage } from "./TripMembersPage";

const noop = () => {};
const denseTrip = buildDenseTripFixture();
const singleMemberTrip = {
  ...tripFixture.trip,
  members: [tripFixture.currentMembers.owner],
};

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

export const OwnerThai: Story = {
  args: Owner.args,
  parameters: { locale: "th" },
};

export const Traveler: Story = {
  args: {
    ...Owner.args,
    currentMember: tripFixture.currentMembers.traveler,
    canManagePeople: false,
  },
};

export const Viewer: Story = {
  args: {
    ...Owner.args,
    currentMember: tripFixture.currentMembers.viewer,
    canManagePeople: false,
  },
};

export const Dense: Story = {
  args: {
    ...Owner.args,
    trip: denseTrip,
    currentMember: denseTrip.members.find((member) => member.role === "owner") ?? tripFixture.currentMembers.owner,
  },
};

export const Empty: Story = {
  args: {
    ...Owner.args,
    trip: singleMemberTrip,
    currentMember: tripFixture.currentMembers.owner,
  },
};

export const Tablet: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "tablet768" } },
};

export const Mobile: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "mobile320" } },
};

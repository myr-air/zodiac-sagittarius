import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { tripFixture } from "@/src/trip/testing/fixtures/trip-fixtures";
import { TravelMotif } from "@/src/shared/components/travel-motifs";
import {
  PageHeader,
  PageHeaderMetaItem,
  PageHeaderTripDateMetaItem,
  PageUserCard,
} from "../PageHeader";
import { friendlyPlay } from "./PageHeader.stories.plays";

const meta = {
  title: "Design System/Page Header",
  component: PageHeader,
  parameters: { layout: "padded" },
  tags: ["ai-generated"],
} satisfies Meta<typeof PageHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Friendly: Story = {
  args: {
    title: "คุมทริปให้พร้อม",
    subtitle: tripFixture.trip.name,
    description: "พื้นที่กลางของเพื่อน ๆ สำหรับตัดสินใจเรื่องทริป",
    meta: (
      <>
        <PageHeaderTripDateMetaItem startDate={tripFixture.trip.startDate} endDate={tripFixture.trip.endDate} />
        <PageHeaderMetaItem icon="location">{tripFixture.trip.destinationLabel}</PageHeaderMetaItem>
      </>
    ),
    aside: <PageUserCard color={tripFixture.currentMembers.owner.color} name={tripFixture.currentMembers.owner.displayName} label="จัดทริปกับเพื่อน" />,
    motif: <TravelMotif tone="postcard" />,
  },
  play: friendlyPlay,
};

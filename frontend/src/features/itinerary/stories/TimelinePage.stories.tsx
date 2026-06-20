import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TimelineView } from "@/src/features/itinerary/components";
import {
  advisoryWarningPlay,
  densePlay,
  emptyPlay,
  mobilePlay,
  ownerThaiPlay,
  planABAlternativesPlay,
  responsivePlay,
  tabletPlay,
  travelerPlay,
} from "./TimelinePage.stories.plays";
import {
  denseTimelineItems,
  emptyTimelineItems,
  timelineAdvisoryItems,
  timelineOwnerStoryArgs,
  timelinePlanABAlternativeItems,
} from "./TimelinePage.stories.support";

const meta = {
  title: "Pages/Timeline",
  component: TimelineView,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof TimelineView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Owner: Story = {
  args: timelineOwnerStoryArgs,
};

export const OwnerThai: Story = {
  args: Owner.args,
  parameters: { locale: "th" },
  play: ownerThaiPlay,
};

export const Traveler: Story = {
  args: Owner.args,
  play: travelerPlay,
};

export const Viewer: Story = {
  args: Owner.args,
  play: Traveler.play,
};

export const Dense: Story = {
  args: {
    ...Owner.args,
    items: denseTimelineItems,
    selectedItemId: "",
  },
  play: densePlay,
};

export const Empty: Story = {
  args: {
    ...Owner.args,
    items: emptyTimelineItems,
    selectedItemId: "",
  },
  play: emptyPlay,
};

export const PlanABAlternatives: Story = {
  args: {
    ...Owner.args,
    items: timelinePlanABAlternativeItems,
    selectedItemId: "timeline-plan-ab-main-breakfast",
  },
  play: planABAlternativesPlay,
};

export const AdvisoryWarning: Story = {
  args: {
    ...Owner.args,
    items: timelineAdvisoryItems,
    selectedItemId: "timeline-advisory-main",
  },
  play: advisoryWarningPlay,
};

export const Tablet: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "tablet768" } },
  play: tabletPlay,
};

export const Desktop1024: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "desktop1024" } },
  play: responsivePlay,
};

export const Desktop1440: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "desktop1440" } },
  play: responsivePlay,
};

export const Mobile: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "mobile320" } },
  play: mobilePlay,
};

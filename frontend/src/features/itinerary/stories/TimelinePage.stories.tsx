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
import {
  ownerArgsStory,
  viewportStory,
} from "@/src/shared/storybook/story-builders";

const meta = {
  title: "Pages/Timeline",
  component: TimelineView,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof TimelineView>;

export default meta;

type Story = StoryObj<typeof meta>;
const ownerStory = ownerArgsStory<Story>;
const viewportStoryForOwner = viewportStory<Story>;

export const Owner: Story = {
  args: timelineOwnerStoryArgs,
};

export const OwnerThai: Story = ownerStory(Owner.args, {}, ownerThaiPlay, {
  locale: "th",
});

export const Traveler: Story = ownerStory(Owner.args, {}, travelerPlay);

export const Viewer: Story = ownerStory(Owner.args, {}, Traveler.play);

export const Dense: Story = ownerStory(Owner.args, {
  items: denseTimelineItems,
  selectedItemId: "",
}, densePlay);

export const Empty: Story = ownerStory(Owner.args, {
  items: emptyTimelineItems,
  selectedItemId: "",
}, emptyPlay);

export const PlanABAlternatives: Story = ownerStory(Owner.args, {
  items: timelinePlanABAlternativeItems,
  selectedItemId: "timeline-plan-ab-main-breakfast",
}, planABAlternativesPlay);

export const AdvisoryWarning: Story = ownerStory(Owner.args, {
  items: timelineAdvisoryItems,
  selectedItemId: "timeline-advisory-main",
}, advisoryWarningPlay);

export const Tablet: Story = viewportStoryForOwner(Owner.args, "tablet768", tabletPlay);

export const Desktop1024: Story = viewportStoryForOwner(
  Owner.args,
  "desktop1024",
  responsivePlay,
);

export const Desktop1440: Story = viewportStoryForOwner(
  Owner.args,
  "desktop1440",
  responsivePlay,
);

export const Mobile: Story = viewportStoryForOwner(Owner.args, "mobile320", mobilePlay);

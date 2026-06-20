import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RouteMapView } from "@/src/features/itinerary/components";
import {
  denseMapItems,
  emptyMapItems,
  mapOwnerStoryArgs,
  mapPlanABAlternativeItems,
  mapStopsWithoutCoordinatesItems,
} from "./MapPage.stories.support";
import {
  liveMapFailurePlay,
  liveMapLoadingPlay,
  ownerThaiPlay,
  planABAlternativesPlay,
  responsivePlay,
  stopsWithoutCoordinatesPlay,
} from "./MapPage.stories.plays";
import {
  ownerArgsStory,
  viewportStory,
} from "@/src/shared/storybook/story-builders";

const meta = {
  title: "Pages/Map",
  component: RouteMapView,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof RouteMapView>;

export default meta;

type Story = StoryObj<typeof meta>;
const ownerStory = ownerArgsStory<Story>;
const viewportStoryForOwner = viewportStory<Story>;

export const Owner: Story = {
  args: mapOwnerStoryArgs,
};

export const OwnerThai: Story = ownerStory(Owner.args, {}, ownerThaiPlay, {
  locale: "th",
});

export const Traveler: Story = ownerStory(Owner.args, {});

export const Viewer: Story = ownerStory(Owner.args, {});

export const Dense: Story = ownerStory(Owner.args, {
  items: denseMapItems,
});

export const Empty: Story = ownerStory(Owner.args, {
  items: emptyMapItems,
});

export const LiveMapLoading: Story = ownerStory(Owner.args, {
  liveMapAvailability: "loading",
  liveMapEnabled: true,
}, liveMapLoadingPlay);

export const LiveMapFailure: Story = ownerStory(Owner.args, {
  liveMapAvailability: "error",
  liveMapEnabled: true,
}, liveMapFailurePlay);

export const PlanABAlternatives: Story = ownerStory(Owner.args, {
  items: mapPlanABAlternativeItems,
}, planABAlternativesPlay);

export const StopsWithoutCoordinates: Story = ownerStory(Owner.args, {
  items: mapStopsWithoutCoordinatesItems,
}, stopsWithoutCoordinatesPlay);

export const Tablet: Story = viewportStoryForOwner(Owner.args, "tablet768", responsivePlay);

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

export const Mobile: Story = viewportStoryForOwner(Owner.args, "mobile320", responsivePlay);

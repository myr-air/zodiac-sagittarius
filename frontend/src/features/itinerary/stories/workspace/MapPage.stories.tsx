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

const meta = {
  title: "Pages/Map",
  component: RouteMapView,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof RouteMapView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Owner: Story = {
  args: mapOwnerStoryArgs,
};

export const OwnerThai: Story = {
  args: Owner.args,
  parameters: { locale: "th" },
  play: ownerThaiPlay,
};

export const Traveler: Story = {
  args: Owner.args,
};

export const Viewer: Story = {
  args: Owner.args,
};

export const Dense: Story = {
  args: {
    ...Owner.args,
    items: denseMapItems,
  },
};

export const Empty: Story = {
  args: {
    ...Owner.args,
    items: emptyMapItems,
  },
};

export const LiveMapLoading: Story = {
  args: {
    ...Owner.args,
    liveMapAvailability: "loading",
    liveMapEnabled: true,
  },
  play: liveMapLoadingPlay,
};

export const LiveMapFailure: Story = {
  args: {
    ...Owner.args,
    liveMapAvailability: "error",
    liveMapEnabled: true,
  },
  play: liveMapFailurePlay,
};

export const PlanABAlternatives: Story = {
  args: {
    ...Owner.args,
    items: mapPlanABAlternativeItems,
  },
  play: planABAlternativesPlay,
};

export const StopsWithoutCoordinates: Story = {
  args: {
    ...Owner.args,
    items: mapStopsWithoutCoordinatesItems,
  },
  play: stopsWithoutCoordinatesPlay,
};

export const Tablet: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "tablet768" } },
  play: responsivePlay,
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
  play: responsivePlay,
};

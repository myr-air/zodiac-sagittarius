import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { viewportStory } from "@/src/shared/storybook/story-builders";
import { weatherBriefings } from "./WeatherBriefing.fixtures";
import { WeatherForecastStrip } from "./WeatherForecastStrip";
import { emptyPlay } from "./WeatherForecastStrip.stories.plays";

const meta = {
  title: "Design System/Weather Forecast Strip",
  component: WeatherForecastStrip,
  parameters: { layout: "padded" },
  tags: ["ai-generated"],
} satisfies Meta<typeof WeatherForecastStrip>;

export default meta;

type Story = StoryObj<typeof meta>;
const forecastViewportStory = viewportStory<Story>;

export const AtmosphericGlass: Story = {
  args: {
    briefings: weatherBriefings,
    locale: "en",
    selectedDate: "2026-07-12",
    onSelect: () => {},
  },
};

export const MobileOverflow: Story = forecastViewportStory(
  {
    briefings: weatherBriefings,
    locale: "en",
    selectedDate: null,
    onSelect: () => {},
  },
  "mobile320",
  undefined,
);

export const Thai: Story = {
  args: {
    briefings: weatherBriefings,
    locale: "th",
    selectedDate: null,
    onSelect: () => {},
  },
};

export const Empty: Story = {
  args: {
    briefings: [],
    locale: "en",
    selectedDate: null,
    onSelect: () => {},
  },
  play: emptyPlay,
};

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { weatherBriefings } from "./WeatherBriefing.fixtures";
import { WeatherForecastStrip } from "./WeatherForecastStrip";

const meta = {
  title: "Design System/Weather Forecast Strip",
  component: WeatherForecastStrip,
  parameters: { layout: "padded" },
  tags: ["ai-generated"],
} satisfies Meta<typeof WeatherForecastStrip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const AtmosphericGlass: Story = {
  args: {
    briefings: weatherBriefings,
    locale: "en",
    selectedDate: "2026-07-12",
    onSelect: () => {},
  },
};

export const MobileOverflow: Story = {
  args: {
    briefings: weatherBriefings,
    locale: "en",
    selectedDate: null,
    onSelect: () => {},
  },
  parameters: { viewport: { defaultViewport: "mobile1" } },
};

export const Thai: Story = {
  args: {
    briefings: weatherBriefings,
    locale: "th",
    selectedDate: null,
    onSelect: () => {},
  },
};

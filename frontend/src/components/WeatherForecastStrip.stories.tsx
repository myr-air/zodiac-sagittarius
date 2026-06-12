import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
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
  parameters: { viewport: { defaultViewport: "mobile320" } },
};

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
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("region", { name: /Daily weather forecast/i })).toHaveClass("weather-forecast-strip");
    await expect(canvas.getByText(/No weather data yet/i)).toHaveClass("weather-forecast-empty-state");
    await expect(canvas.queryByRole("button")).toBeNull();
  },
};

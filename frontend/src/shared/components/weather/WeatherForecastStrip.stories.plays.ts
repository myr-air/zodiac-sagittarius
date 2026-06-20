import type { StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import type { WeatherForecastStrip } from "./WeatherForecastStrip";

type WeatherForecastStripPlay = NonNullable<StoryObj<typeof WeatherForecastStrip>["play"]>;

export const emptyPlay: WeatherForecastStripPlay = async ({ canvas }) => {
  await expect(canvas.getByRole("region", { name: /Daily weather forecast/i })).toHaveClass("weather-forecast-strip");
  await expect(canvas.getByText(/No weather data yet/i)).toHaveClass("weather-forecast-empty-state");
  await expect(canvas.queryByRole("button")).toBeNull();
};

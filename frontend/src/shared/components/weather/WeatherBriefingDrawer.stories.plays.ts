import type { StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import type { WeatherBriefingDrawer } from "./WeatherBriefingDrawer";

type WeatherBriefingDrawerPlay = NonNullable<StoryObj<typeof WeatherBriefingDrawer>["play"]>;

export const partialDataPlay: WeatherBriefingDrawerPlay = async ({ canvas }) => {
  await expect(canvas.getByRole("region", { name: /Weather briefing/i })).toHaveClass("weather-briefing-drawer");
  await expect(canvas.getByRole("heading", { name: /^Forecast pending$/i })).toBeVisible();
  await expect(canvas.getAllByText(/No data yet/i).length).toBeGreaterThan(1);
  await expect(canvas.getByLabelText(/Outfit advice override/i)).toBeVisible();
};

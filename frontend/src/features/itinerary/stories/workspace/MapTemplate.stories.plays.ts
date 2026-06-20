import type { StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import type { RouteMapView } from "@/src/features/itinerary/components";

type MapTemplatePlay = NonNullable<StoryObj<typeof RouteMapView>["play"]>;

export const ownerThaiPlay: MapTemplatePlay = async ({ canvas }) => {
  await expect(canvas.getByRole("region", { name: /แผนที่เส้นทาง/i })).toBeVisible();
  await expect(canvas.getByRole("region", { name: /แผนที่เส้นทาง/i })).toHaveClass("route-map-panel", "grid");
  await expect(canvas.getByLabelText(/ตัวอย่างแผนที่เส้นทางฮ่องกงและเซินเจิ้น/i)).toHaveClass("route-map-canvas", "relative");
  await expect(canvas.getByRole("button", { name: /วันที่ 2/i })).toHaveClass("map-day-filter-button", "inline-flex");
};

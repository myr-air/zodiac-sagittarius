import { expect } from "storybook/test";
import type { RouteMapView } from "@/src/features/itinerary/components";
import type { StoryPlay } from "../support/story-play-types";
import { expectMapResponsiveContract } from "./MapPage.stories.support";

type MapPagePlay = StoryPlay<typeof RouteMapView>;

export const ownerThaiPlay: MapPagePlay = async ({ canvas }) => {
  await expect(canvas.getByRole("region", { name: /แผนที่เส้นทาง/i })).toHaveClass("route-map-panel");
  await expect(canvas.getByText("แผนที่")).toBeVisible();
  await expect(canvas.getByLabelText(/เลือกวันบนแผนที่/i)).toBeVisible();
};

export const liveMapLoadingPlay: MapPagePlay = async ({ canvas }) => {
  await expect(canvas.getByLabelText(/Map preview.*Hong Kong and Shenzhen/i)).toHaveAttribute(
    "data-live-map-state",
    "loading",
  );
  await expect(canvas.getByText(/Loading map from OpenFreeMap/i)).toHaveClass("route-map-status");
  await expect(canvas.getByText("Hong Kong")).toBeVisible();
};

export const liveMapFailurePlay: MapPagePlay = async ({ canvas }) => {
  await expect(canvas.getByLabelText(/Map preview.*Hong Kong and Shenzhen/i)).toHaveAttribute(
    "data-live-map-state",
    "error",
  );
  await expect(canvas.getByRole("status")).toHaveTextContent(/Could not load the live map/i);
  await expect(canvas.queryByRole("button", { name: /Retry live map/i })).toBeNull();
  await expect(canvas.getByText(/OpenFreeMap/i)).toHaveClass("map-source-note");
};

export const planABAlternativesPlay: MapPagePlay = async ({ canvas }) => {
  await expect(canvas.getByRole("region", { name: /Route map/i })).toHaveClass("route-map-panel");
  await expect(canvas.getByText("Plan A gallery route")).toBeVisible();
  await expect(canvas.getByText("Plan B harbour route")).toBeVisible();
};

export const stopsWithoutCoordinatesPlay: MapPagePlay = async ({ canvas }) => {
  await expect(canvas.getByRole("region", { name: /Route map/i })).toHaveClass("route-map-panel");
  await expect(canvas.getByLabelText(/Activities without coordinates/i)).toBeVisible();
  await expect(canvas.getByText(/1 activities need coordinates/i)).toBeVisible();
  await expect(canvas.getByText("Unresolved dinner venue")).toBeVisible();
};

export const responsivePlay: MapPagePlay = async ({ canvasElement }) => {
  await expectMapResponsiveContract(canvasElement);
};

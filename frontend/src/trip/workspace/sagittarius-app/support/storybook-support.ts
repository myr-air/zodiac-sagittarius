import { expect } from "storybook/test";
import type { StoryObj } from "@storybook/nextjs-vite";
import type { SagittariusApp } from "@/src/app/SagittariusApp";
import { seedTripJoinId } from "@/src/trip/auth";
import {
  buildDenseTripFixture,
  buildEmptyTripFixture,
  tripFixture,
} from "@/src/trip/trip-fixtures";
import type { SagittariusAppProps } from "@/src/trip/workspace/sagittarius-app/types";
import type { PlanningView } from "@/src/trip/workspace/planning-view";

type SagittariusAppStory = StoryObj<typeof SagittariusApp>;
type SagittariusAppPlay = NonNullable<SagittariusAppStory["play"]>;
type SagittariusViewport = "mobile320" | "tablet768" | "desktop1024" | "desktop1440";

export const storyTripId = "trip-1";
export const travelerMemberId = tripFixture.currentMembers.traveler.id;
export const viewerMemberId = tripFixture.currentMembers.viewer.id;
export const denseTrip = buildDenseTripFixture();
export const emptyTrip = buildEmptyTripFixture();
export { seedTripJoinId };

export function appViewStory(
  initialView: PlanningView,
  play?: SagittariusAppPlay,
): SagittariusAppStory {
  return {
    args: { initialView },
    ...(play ? { play } : {}),
  };
}

export function appRouteStory(
  args: Pick<
    SagittariusAppProps,
    | "accessMode"
    | "dataSource"
    | "initialJoinCode"
    | "initialView"
    | "portalSection"
    | "requireJoin"
    | "routeTripId"
  >,
  navigation: { pathname: string },
): SagittariusAppStory {
  return {
    args,
    parameters: {
      nextjs: { navigation },
    },
  };
}

export function appViewportStory(
  initialView: PlanningView,
  defaultViewport: SagittariusViewport,
  play: SagittariusAppPlay,
): SagittariusAppStory {
  return {
    args: { initialView },
    parameters: {
      viewport: { defaultViewport },
    },
    play,
  };
}

export async function expectWorkspaceView(
  canvasElement: HTMLElement,
  viewClassName: string,
) {
  await expect(canvasElement.querySelector(".workspace-shell")).toBeInTheDocument();
  await expect(canvasElement.querySelector(".workspace-grid")).toHaveClass(
    "grid-cols-[minmax(0,1fr)]",
  );
  await expect(canvasElement.querySelector(".planning-main")).toBeInTheDocument();
  await expect(canvasElement.querySelector(viewClassName)).toBeInTheDocument();
}

export async function expectOverviewView({
  canvasElement,
}: {
  canvasElement: HTMLElement;
}) {
  await expectWorkspaceView(canvasElement, ".overview-page");
}

export async function expectItineraryView({
  canvasElement,
}: {
  canvasElement: HTMLElement;
}) {
  await expectWorkspaceView(canvasElement, ".table-panel");
  await expect(canvasElement.querySelector(".table-scroll")).toHaveClass(
    "overflow-x-auto",
  );
  await expect(canvasElement.querySelector(".smart-table")).toHaveClass(
    "min-w-[520px]",
  );
  await expect(canvasElement.querySelector(".item-placeholder-cell")).toBeInTheDocument();
}

export async function expectTimelineView({
  canvasElement,
}: {
  canvasElement: HTMLElement;
}) {
  await expectWorkspaceView(canvasElement, ".timeline-panel");
  await expect(canvasElement.querySelector(".timeline-grid")).toBeInTheDocument();
}

export async function expectMapView({
  canvasElement,
}: {
  canvasElement: HTMLElement;
}) {
  await expectWorkspaceView(canvasElement, ".route-map-panel");
  await expect(canvasElement.querySelector(".route-map-canvas")).toBeInTheDocument();
}

export async function expectMembersView({
  canvasElement,
}: {
  canvasElement: HTMLElement;
}) {
  await expectWorkspaceView(canvasElement, ".members-page");
  await expect(canvasElement.querySelector(".member-command-bar")).toBeInTheDocument();
}

export async function expectExpensesView({
  canvasElement,
}: {
  canvasElement: HTMLElement;
}) {
  await expectWorkspaceView(canvasElement, ".expenses-page");
  await expect(canvasElement.querySelector(".expenses-content")).toBeInTheDocument();
}

export async function expectBookingsView({
  canvasElement,
}: {
  canvasElement: HTMLElement;
}) {
  await expectWorkspaceView(canvasElement, ".bookings-docs-page");
  await expect(canvasElement.querySelector(".bookings-content")).toBeInTheDocument();
}

export async function expectPhotosView({
  canvasElement,
}: {
  canvasElement: HTMLElement;
}) {
  await expectWorkspaceView(canvasElement, ".trip-photos-page");
  await expect(canvasElement.querySelector(".photos-content")).toBeInTheDocument();
}

export async function expectSettingsView({
  canvasElement,
}: {
  canvasElement: HTMLElement;
}) {
  await expectWorkspaceView(canvasElement, ".trip-settings-page");
  await expect(canvasElement.querySelector("form[aria-label]")).toBeInTheDocument();
}

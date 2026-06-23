import type { StoryObj } from "@storybook/nextjs-vite";
import type { SagittariusApp } from "@/src/app/SagittariusApp";
import type { PlanningView } from "@/src/trip/workspace/planning-view";
import type { SagittariusAppProps } from "@/src/trip/workspace/sagittarius-app/types";

export type SagittariusAppStory = StoryObj<typeof SagittariusApp>;
type SagittariusAppPlay = NonNullable<SagittariusAppStory["play"]>;
type SagittariusViewport = "mobile320" | "tablet768" | "desktop1024" | "desktop1440";

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

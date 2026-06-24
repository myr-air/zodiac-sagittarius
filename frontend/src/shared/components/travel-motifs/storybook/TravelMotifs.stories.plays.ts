import type { StoryObj } from "@storybook/nextjs-vite";
import { expectStoryElementAttribute } from "@/src/shared/storybook/story-assertions";
import type { TravelMotif } from "../TravelMotifs";

type TravelMotifPlay = NonNullable<StoryObj<typeof TravelMotif>["play"]>;

export const routePlay: TravelMotifPlay = async ({ canvasElement }) => {
  await expectStoryElementAttribute(canvasElement, ".travel-motif--route", "aria-hidden", "true");
};

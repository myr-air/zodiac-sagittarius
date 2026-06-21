import type { StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import type { TravelMotif } from "../TravelMotifs";

type TravelMotifPlay = NonNullable<StoryObj<typeof TravelMotif>["play"]>;

export const routePlay: TravelMotifPlay = async ({ canvasElement }) => {
  await expect(canvasElement.querySelector(".travel-motif--route")).toHaveAttribute("aria-hidden", "true");
};

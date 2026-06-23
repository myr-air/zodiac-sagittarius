import type { StoryObj } from "@storybook/nextjs-vite";

export type StoryPlay<TComponent> = NonNullable<StoryObj<TComponent>["play"]>;
export type UntypedStoryPlay = NonNullable<StoryObj["play"]>;

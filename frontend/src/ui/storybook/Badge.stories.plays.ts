import type { StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import type { Badge } from "@/src/ui";

type BadgePlay = NonNullable<StoryObj<typeof Badge>["play"]>;

export const galleryPlay: BadgePlay = async ({ canvas }) => {
  const badge = canvas.getByText("พร้อมแล้ว");
  await expect(badge).toHaveClass("badge--success");
  await expect(badge).toHaveClass("bg-(--color-success-soft)");
};

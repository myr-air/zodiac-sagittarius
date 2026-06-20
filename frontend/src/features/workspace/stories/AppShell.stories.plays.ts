import type { StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import type { AppShell } from "@/src/features/workspace/components/app-shell";

type AppShellPlay = NonNullable<StoryObj<typeof AppShell>["play"]>;

export const ownerPlay: AppShellPlay = async ({ canvas }) => {
  await expect(canvas.getByRole("link", { name: /Overview/i })).toHaveAttribute("aria-current", "page");
};

export const travelerPlay: AppShellPlay = async ({ canvas }) => {
  await expect(canvas.getByText("Explorer Friend")).toBeVisible();
  await expect(canvas.getAllByText("Traveler").length).toBeGreaterThan(0);
};

export const viewerPlay: AppShellPlay = async ({ canvas }) => {
  await expect(canvas.getByText("Family Member")).toBeVisible();
  await expect(canvas.getByText("Viewer")).toBeVisible();
};

export const ownerThaiPlay: AppShellPlay = async ({ canvas }) => {
  await expect(canvas.getByRole("navigation", { name: /เมนูวางแผน Joii/i })).toBeVisible();
  await expect(canvas.getByRole("link", { name: /ภาพรวม/i })).toHaveAttribute("aria-current", "page");
};

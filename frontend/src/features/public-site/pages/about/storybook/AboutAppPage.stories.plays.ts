import type { StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import type { AboutAppPage } from "../AboutAppPage";

type AboutAppPagePlay = NonNullable<StoryObj<typeof AboutAppPage>["play"]>;

export const readyPlay: AboutAppPagePlay = async ({ canvas }) => {
  await expect(canvas.getByRole("heading", { name: "About Joii" })).toBeVisible();
  await expect(await canvas.findByText("API connected")).toBeVisible();
  await expect(await canvas.findByText("Joii v0.2.0")).toBeVisible();
};

export const apiUnavailablePlay: AboutAppPagePlay = async ({ canvas }) => {
  await expect(canvas.getByRole("heading", { name: "About Joii" })).toBeVisible();
  await expect(await canvas.findByText("API version unavailable")).toBeVisible();
};

export const thaiPlay: AboutAppPagePlay = async ({ canvas }) => {
  await expect(canvas.getByRole("heading", { name: "เกี่ยวกับ Joii" })).toBeVisible();
  await expect(await canvas.findByText("เชื่อมต่อ API แล้ว")).toBeVisible();
  await expect(canvas.getByRole("heading", { name: "เวอร์ชันแอป" })).toBeVisible();
};

export const mobilePlay: AboutAppPagePlay = async ({ canvas, canvasElement }) => {
  await expect(canvas.getByRole("heading", { name: "About Joii" })).toBeVisible();
  await expect(canvasElement.querySelector(".about-hero > [aria-hidden='true']")).toHaveClass("hidden", "md:block");
};

export const tabletPlay: AboutAppPagePlay = async ({ canvas, canvasElement }) => {
  await expect(canvas.getByRole("heading", { name: "About Joii" })).toBeVisible();
  await expect(canvasElement.querySelector(".about-hero")).toHaveClass("md:grid-cols-[minmax(0,1fr)_300px]");
};

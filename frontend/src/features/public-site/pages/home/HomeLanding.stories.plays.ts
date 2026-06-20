import type { StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import type { HomeLanding } from "./HomeLanding";

type HomeLandingPlay = NonNullable<StoryObj<typeof HomeLanding>["play"]>;

async function expectLandingStructure(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  await expect(canvas.getByRole("navigation", { name: /Joii landing navigation|เมนูหน้าแรก Joii/i })).toBeVisible();
  await expect(canvas.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(canvas.getByLabelText(/Product preview|ตัวอย่างสินค้า/i)).toHaveClass("home-product-preview", "max-[760px]:hidden");
  await expect(canvasElement.querySelector(".home-workflow-grid")).toHaveClass("home-workflow-grid", "max-[760px]:grid-cols-1");
}

export const pixelPerfectPlay: HomeLandingPlay = async ({ canvas, canvasElement }) => {
  await expectLandingStructure(canvasElement);
  await expect(canvas.getByRole("heading", { name: /Plan trips with friends easier and more fun/i })).toBeVisible();
  await expect(canvas.getAllByRole("link", { name: /Trip access/i }).length).toBeGreaterThan(0);
  await expect(canvas.getByLabelText(/Trip workspace sections/i)).toBeVisible();
};

export const thaiPlay: HomeLandingPlay = async ({ canvas, canvasElement }) => {
  await expectLandingStructure(canvasElement);
  await expect(canvas.getByRole("heading", { name: /วางแผนทริปกับเพื่อน\s+ง่ายขึ้น สนุกขึ้น/i })).toBeVisible();
  await expect(canvas.getAllByRole("link", { name: /เข้าทริป/i }).length).toBeGreaterThan(0);
  await expect(canvas.getByLabelText(/เมนูพื้นที่วางแผนของทริป/i)).toHaveClass("home-preview-menu", "max-[760px]:grid-cols-2");
};

export const compactHeroPlay: HomeLandingPlay = async ({ canvasElement }) => {
  await expectLandingStructure(canvasElement);
  await expect(canvasElement.querySelector(".home-hero")).toHaveClass("max-[1120px]:grid-cols-1");
};

export const desktop1440Play: HomeLandingPlay = async ({ canvasElement }) => {
  await expectLandingStructure(canvasElement);
  await expect(canvasElement.querySelector(".home-preview-grid")).toHaveClass("grid-cols-[168px_minmax(0,1fr)]");
};

export const mobilePlay: HomeLandingPlay = async ({ canvasElement }) => {
  await expectLandingStructure(canvasElement);
  await expect(canvasElement.querySelector(".home-hero-actions")).toHaveClass("max-[760px]:hidden");
};

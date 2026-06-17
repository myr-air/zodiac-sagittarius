import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { HomeLanding } from "./HomeLanding";
import { appRoutes } from "@/src/trip/workspace/sagittarius-app/support";

const meta = {
  title: "Pages/Home Landing",
  component: HomeLanding,
  parameters: {
    layout: "fullscreen",
    nextjs: { navigation: { pathname: appRoutes.home() } },
  },
} satisfies Meta<typeof HomeLanding>;

export default meta;

type Story = StoryObj<typeof meta>;

async function expectLandingStructure(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  await expect(canvas.getByRole("navigation", { name: /Joii landing navigation|เมนูหน้าแรก Joii/i })).toBeVisible();
  await expect(canvas.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(canvas.getByLabelText(/Product preview|ตัวอย่างสินค้า/i)).toHaveClass("home-product-preview", "max-[760px]:hidden");
  await expect(canvasElement.querySelector(".home-workflow-grid")).toHaveClass("home-workflow-grid", "max-[760px]:grid-cols-1");
}

export const PixelPerfect: Story = {
  play: async ({ canvas, canvasElement }) => {
    await expectLandingStructure(canvasElement);
    await expect(canvas.getByRole("heading", { name: /Plan trips with friends easier and more fun/i })).toBeVisible();
    await expect(canvas.getAllByRole("link", { name: /Trip access/i }).length).toBeGreaterThan(0);
    await expect(canvas.getByLabelText(/Trip workspace sections/i)).toBeVisible();
  },
};

export const Thai: Story = {
  parameters: { locale: "th" },
  play: async ({ canvas, canvasElement }) => {
    await expectLandingStructure(canvasElement);
    await expect(canvas.getByRole("heading", { name: /วางแผนทริปกับเพื่อน\s+ง่ายขึ้น สนุกขึ้น/i })).toBeVisible();
    await expect(canvas.getAllByRole("link", { name: /เข้าทริป/i }).length).toBeGreaterThan(0);
    await expect(canvas.getByLabelText(/เมนูพื้นที่วางแผนของทริป/i)).toHaveClass("home-preview-menu", "max-[760px]:grid-cols-2");
  },
};

export const Tablet: Story = {
  parameters: {
    viewport: { defaultViewport: "tablet768" },
  },
  play: async ({ canvasElement }) => {
    await expectLandingStructure(canvasElement);
    await expect(canvasElement.querySelector(".home-hero")).toHaveClass("max-[1120px]:grid-cols-1");
  },
};

export const Desktop1024: Story = {
  parameters: {
    viewport: { defaultViewport: "desktop1024" },
  },
  play: async ({ canvasElement }) => {
    await expectLandingStructure(canvasElement);
    await expect(canvasElement.querySelector(".home-hero")).toHaveClass("max-[1120px]:grid-cols-1");
  },
};

export const Desktop1440: Story = {
  parameters: {
    viewport: { defaultViewport: "desktop1440" },
  },
  play: async ({ canvasElement }) => {
    await expectLandingStructure(canvasElement);
    await expect(canvasElement.querySelector(".home-preview-grid")).toHaveClass("grid-cols-[168px_minmax(0,1fr)]");
  },
};

export const Mobile: Story = {
  parameters: {
    viewport: { defaultViewport: "mobile320" },
  },
  play: async ({ canvasElement }) => {
    await expectLandingStructure(canvasElement);
    await expect(canvasElement.querySelector(".home-hero-actions")).toHaveClass("max-[760px]:hidden");
  },
};

import type { StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent } from "storybook/test";
import type { OverviewPage } from "@/src/features/itinerary/components";
import { expectOverviewStructure } from "./OverviewPage.stories.support";

type OverviewPagePlay = NonNullable<StoryObj<typeof OverviewPage>["play"]>;

export const ownerPlay: OverviewPagePlay = async ({ canvas, canvasElement }) => {
  await expectOverviewStructure(canvasElement);
  await expect(canvas.getByRole("region", { name: /Trip readiness/i })).toBeVisible();
  await expect(canvas.getByRole("region", { name: /Trip checklist/i })).toBeVisible();
  await expect(canvas.getByRole("button", { name: /Add checklist item/i })).toBeVisible();
  await expect(canvas.getByRole("group", { name: /Checklist scope/i })).toBeVisible();
};

export const ownerThaiPlay: OverviewPagePlay = async ({ canvas }) => {
  await expect(canvas.getByText("ศูนย์จัดการทริป")).toBeVisible();
  await expect(canvas.getByRole("region", { name: /เช็กลิสต์ของทริป/i })).toBeVisible();
  await expect(canvas.getByRole("button", { name: /เพิ่มเช็กลิสต์/i })).toBeVisible();
};

export const travelerPlay: OverviewPagePlay = async ({ canvas, canvasElement }) => {
  await expectOverviewStructure(canvasElement);
  await expect(canvas.getByRole("region", { name: /Today and next focus/i })).toBeVisible();
  await expect(canvas.getByRole("region", { name: /Traveler highlights/i })).toBeVisible();
  await expect(canvas.getByRole("region", { name: /My travel checklist/i })).toBeVisible();
  await expect(canvas.getByPlaceholderText(/For example, pack a travel adapter/i)).toBeVisible();
  await expect(canvas.queryByRole("region", { name: /Trip readiness/i })).toBeNull();
};

export const viewerPlay: OverviewPagePlay = async ({ canvas, canvasElement }) => {
  await expectOverviewStructure(canvasElement);
  await expect(canvas.getByRole("region", { name: /Read-only trip snapshot/i })).toBeVisible();
  await expect(canvas.getByRole("region", { name: /Next important stop/i })).toBeVisible();
  await expect(canvas.queryByRole("textbox")).toBeNull();
  await expect(canvas.queryByRole("button", { name: /Add checklist item/i })).toBeNull();
};

export const densePlay: OverviewPagePlay = async ({ canvasElement }) => {
  await expectOverviewStructure(canvasElement);
  await expect(canvasElement.querySelectorAll(".overview-highlight-item").length).toBeGreaterThan(2);
  await expect(canvasElement.querySelectorAll(".overview-panel").length).toBeGreaterThan(2);
};

export const emptyPlay: OverviewPagePlay = async ({ canvas, canvasElement }) => {
  await expectOverviewStructure(canvasElement);
  await expect(canvas.getByText(/No itinerary yet/i)).toBeVisible();
  await expect(canvasElement.querySelectorAll(".overview-task-item").length).toBe(0);
};

export const addTaskDialogOpenPlay: OverviewPagePlay = async ({ canvas }) => {
  await userEvent.click(canvas.getByRole("button", { name: /Add checklist/i }));
  await expect(canvas.getByRole("dialog", { name: /Add checklist/i })).toBeVisible();
  await expect(canvas.getByPlaceholderText(/For example, book dinner/i)).toBeVisible();
  await expect(canvas.getByText("Keep it in")).toBeVisible();
  await expect(canvas.getAllByRole("button", { name: /Add checklist item/i })[1]).toBeDisabled();
};

export const tabletPlay: OverviewPagePlay = async ({ canvasElement }) => {
  await expectOverviewStructure(canvasElement);
  await expect(canvasElement.querySelector(".overview-grid")).toHaveClass("max-[1199px]:grid-cols-1");
};

export const desktop1440Play: OverviewPagePlay = async ({ canvasElement }) => {
  await expectOverviewStructure(canvasElement);
  await expect(canvasElement.querySelector(".overview-travel-cockpit")).toHaveClass("grid-cols-3");
};

export const mobilePlay: OverviewPagePlay = async ({ canvasElement }) => {
  await expectOverviewStructure(canvasElement);
  await expect(canvasElement.querySelector(".overview-hero")).toHaveClass("max-[1199px]:grid-cols-1");
  await expect(canvasElement.querySelector(".overview-highlight-list")).toHaveClass(
    "max-[767px]:flex",
    "max-[767px]:overflow-x-auto",
  );
};

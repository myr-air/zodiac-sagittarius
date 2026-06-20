import type { StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent } from "storybook/test";
import type { TripPhotosPage } from "./TripPhotosPage";
import { expectPhotosResponsiveContract } from "./TripPhotosPage.stories.support";

type TripPhotosPagePlay = NonNullable<StoryObj<typeof TripPhotosPage>["play"]>;

export const ownerPlay: TripPhotosPagePlay = async ({ canvas }) => {
  await expect(canvas.getByRole("region", { name: /Photos & albums/i })).toHaveClass("trip-photos-page");
  await expect(canvas.getByRole("button", { name: /Add album/i })).toBeVisible();
};

export const viewerPlay: TripPhotosPagePlay = async ({ canvas }) => {
  await expect(canvas.getByRole("region", { name: /Photos & albums/i })).toHaveClass("trip-photos-page");
  await expect(canvas.queryByRole("button", { name: /Add album/i })).toBeNull();
};

export const ownerThaiPlay: TripPhotosPagePlay = async ({ canvas }) => {
  await expect(canvas.getByRole("region", { name: /รูปภาพและอัลบั้ม/i })).toHaveClass("trip-photos-page");
  await expect(canvas.getByRole("button", { name: /เพิ่มอัลบั้ม/i })).toBeVisible();
  await expect(canvas.getByLabelText(/สรุปอัลบั้มรูปภาพ/i)).toBeVisible();
  await expect(canvas.getByLabelText(/ผู้ให้บริการรูปภาพ/i)).toBeVisible();
};

export const addAlbumDialogOpenPlay: TripPhotosPagePlay = async ({ canvas }) => {
  await userEvent.click(canvas.getByRole("button", { name: /Add album/i }));
  await expect(canvas.getByRole("dialog", { name: /Add album/i })).toHaveClass("photos-dialog");
  await expect(canvas.getByText("Album link")).toBeVisible();
  await expect(canvas.getByText("Related itinerary")).toBeVisible();
  await expect(canvas.getByRole("button", { name: /Save album/i })).toBeVisible();
};

export const coverStatesPlay: TripPhotosPagePlay = async ({ canvas }) => {
  const harbourCover = canvas.getByLabelText(/Cover for Harbour skyline handoff/i);
  await expect(harbourCover).toHaveClass("photo-album-cover", "bg-cover", "bg-center");
  await expect(harbourCover.getAttribute("style")).toContain("/landing/auth/photo-hong-kong-skyline.png");

  const fallbackCover = canvas.getByLabelText(/Cover for No cover fallback album/i);
  await expect(fallbackCover).toHaveClass("photo-album-cover", "bg-(--color-surface-subtle)");
  await expect(fallbackCover.getAttribute("style")).toBeNull();
  await expect(canvas.getAllByText(/Use this as the trip recap cover/i).length).toBeGreaterThan(1);
};

export const responsivePlay: TripPhotosPagePlay = async ({ canvasElement }) => {
  await expectPhotosResponsiveContract(canvasElement);
};

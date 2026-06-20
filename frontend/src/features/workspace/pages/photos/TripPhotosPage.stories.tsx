import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent } from "storybook/test";
import { tripFixture } from "@/src/trip/trip-fixtures";
import { TripPhotosPage } from "./TripPhotosPage";
import {
  coverPhotoAlbumLinks,
  densePhotoAlbumLinks,
  expectPhotosResponsiveContract,
  tripPhotosOwnerStoryArgs,
} from "./TripPhotosPage.stories.support";

const meta = {
  title: "Pages/Photos",
  component: TripPhotosPage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof TripPhotosPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Owner: Story = {
  args: tripPhotosOwnerStoryArgs,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("region", { name: /Photos & albums/i })).toHaveClass("trip-photos-page");
    await expect(canvas.getByRole("button", { name: /Add album/i })).toBeVisible();
  },
};

export const Viewer: Story = {
  args: {
    ...Owner.args,
    currentMember: tripFixture.currentMembers.viewer,
    canEditPhotoAlbums: false,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("region", { name: /Photos & albums/i })).toHaveClass("trip-photos-page");
    await expect(canvas.queryByRole("button", { name: /Add album/i })).toBeNull();
  },
};

export const Traveler: Story = {
  args: {
    ...Owner.args,
    currentMember: tripFixture.currentMembers.traveler,
    canEditPhotoAlbums: true,
  },
  play: Owner.play,
};

export const OwnerThai: Story = {
  args: Owner.args,
  parameters: { locale: "th" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("region", { name: /รูปภาพและอัลบั้ม/i })).toHaveClass("trip-photos-page");
    await expect(canvas.getByRole("button", { name: /เพิ่มอัลบั้ม/i })).toBeVisible();
    await expect(canvas.getByLabelText(/สรุปอัลบั้มรูปภาพ/i)).toBeVisible();
    await expect(canvas.getByLabelText(/ผู้ให้บริการรูปภาพ/i)).toBeVisible();
  },
};

export const Dense: Story = {
  args: {
    ...Owner.args,
    photoAlbumLinks: densePhotoAlbumLinks,
  },
};

export const Empty: Story = {
  args: {
    ...Owner.args,
    photoAlbumLinks: [],
  },
};

export const AddAlbumDialogOpen: Story = {
  args: Owner.args,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: /Add album/i }));
    await expect(canvas.getByRole("dialog", { name: /Add album/i })).toHaveClass("photos-dialog");
    await expect(canvas.getByText("Album link")).toBeVisible();
    await expect(canvas.getByText("Related itinerary")).toBeVisible();
    await expect(canvas.getByRole("button", { name: /Save album/i })).toBeVisible();
  },
};

export const CoverStates: Story = {
  args: {
    ...Owner.args,
    photoAlbumLinks: coverPhotoAlbumLinks,
  },
  play: async ({ canvas }) => {
    const harbourCover = canvas.getByLabelText(/Cover for Harbour skyline handoff/i);
    await expect(harbourCover).toHaveClass("photo-album-cover", "bg-cover", "bg-center");
    await expect(harbourCover.getAttribute("style")).toContain("/landing/auth/photo-hong-kong-skyline.png");

    const fallbackCover = canvas.getByLabelText(/Cover for No cover fallback album/i);
    await expect(fallbackCover).toHaveClass("photo-album-cover", "bg-(--color-surface-subtle)");
    await expect(fallbackCover.getAttribute("style")).toBeNull();
    await expect(canvas.getAllByText(/Use this as the trip recap cover/i).length).toBeGreaterThan(1);
  },
};

export const Tablet: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "tablet768" } },
  play: async ({ canvasElement }) => {
    await expectPhotosResponsiveContract(canvasElement);
  },
};

export const Desktop1024: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "desktop1024" } },
  play: async ({ canvasElement }) => {
    await expectPhotosResponsiveContract(canvasElement);
  },
};

export const Desktop1440: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "desktop1440" } },
  play: async ({ canvasElement }) => {
    await expectPhotosResponsiveContract(canvasElement);
  },
};

export const Mobile: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "mobile320" } },
  play: async ({ canvasElement }) => {
    await expectPhotosResponsiveContract(canvasElement);
  },
};

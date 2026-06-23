import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PhotoAlbumExternalLinkAction } from "../components/PhotoAlbumExternalLinkAction";

const meta = {
  title: "Pages/Photos/PhotoAlbumExternalLinkAction",
  component: PhotoAlbumExternalLinkAction,
  parameters: { layout: "centered" },
  args: {
    blockedLabel: "Open blocked",
    blockedMode: "button",
    buttonClassName: "w-auto",
    href: "https://photos.example.test/album",
    openLabel: "Open album",
    variant: "ghost",
  },
} satisfies Meta<typeof PhotoAlbumExternalLinkAction>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SafeCardAction: Story = {};

export const BlockedCardAction: Story = {
  args: {
    href: null,
  },
};

export const BlockedInspectorNotice: Story = {
  args: {
    blockedLabel: "Unsafe link blocked",
    blockedMode: "notice",
    buttonClassName: "w-full",
    href: null,
    variant: undefined,
  },
};

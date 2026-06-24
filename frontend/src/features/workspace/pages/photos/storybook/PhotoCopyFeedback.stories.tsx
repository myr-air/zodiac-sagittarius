import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { photoCopy } from "../content/TripPhotosPage.copy";
import { PhotoCopyFeedback } from "../components/PhotoCopyFeedback";

const meta = {
  title: "Pages/Photos/PhotoCopyFeedback",
  component: PhotoCopyFeedback,
  parameters: { layout: "centered" },
  args: {
    copy: photoCopy.en,
    copyState: "copied",
  },
} satisfies Meta<typeof PhotoCopyFeedback>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Copied: Story = {};

export const Error: Story = {
  args: { copyState: "error" },
};

export const ThaiCopied: Story = {
  args: {
    copy: photoCopy.th,
  },
};

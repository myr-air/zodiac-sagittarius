import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  CopyFeedback,
  workspaceCopyFeedbackCompactBadgeClassName,
  workspaceCopyFeedbackPillClassName,
  workspaceCopyFeedbackSubtleBadgeClassName,
} from "../index";

const meta = {
  title: "Shared/CopyFeedback",
  component: CopyFeedback,
  parameters: { layout: "centered" },
  args: {
    "aria-label": "Copy status",
    className: workspaceCopyFeedbackSubtleBadgeClassName,
    label: "Ready to share",
    state: "idle",
  },
} satisfies Meta<typeof CopyFeedback>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SubtleBadge: Story = {};

export const CompactCopied: Story = {
  args: {
    className: workspaceCopyFeedbackCompactBadgeClassName,
    label: "Copied",
    state: "copied",
  },
};

export const PillError: Story = {
  args: {
    className: workspaceCopyFeedbackPillClassName,
    label: "Copy failed",
    state: "error",
  },
};

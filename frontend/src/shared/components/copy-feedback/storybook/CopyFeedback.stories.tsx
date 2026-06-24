import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  CopyFeedback,
  WorkspaceCopyFeedback,
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

export const WorkspacePill: StoryObj<typeof WorkspaceCopyFeedback> = {
  render: () => (
    <WorkspaceCopyFeedback
      aria-label="Invite copy status"
      className={workspaceCopyFeedbackPillClassName}
      labels={{
        copied: "Copied",
        error: "Copy failed",
        readOnly: "Only organizers can copy",
        ready: "Ready to share",
      }}
      state="copied"
    />
  ),
};

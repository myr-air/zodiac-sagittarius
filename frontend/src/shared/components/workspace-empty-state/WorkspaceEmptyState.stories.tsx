import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { WorkspaceEmptyState } from "./WorkspaceEmptyState";

const meta = {
  title: "Design System/Workspace Empty State",
  component: WorkspaceEmptyState,
  parameters: { layout: "padded" },
  tags: ["ai-generated"],
} satisfies Meta<typeof WorkspaceEmptyState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Panel: Story = {
  args: {
    title: "No matching files",
    detail: "Try another folder, status, or search term.",
    className: "min-h-[180px] rounded-(--radius-md) border border-dashed border-(--color-border-strong) bg-(--color-surface-subtle)",
  },
};

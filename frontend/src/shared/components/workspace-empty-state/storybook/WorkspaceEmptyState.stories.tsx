import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import { WorkspaceEmptyState } from "../WorkspaceEmptyState";

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

export const WithAction: Story = {
  args: {
    title: "No trips yet",
    detail: "Create a workspace before inviting travelers.",
    className:
      "min-h-[180px] gap-3 rounded-(--radius-md) border border-dashed border-(--color-border-strong) bg-(--color-surface-subtle) [&>span[aria-hidden=true]]:grid [&>span[aria-hidden=true]]:size-10 [&>span[aria-hidden=true]]:place-items-center [&>span[aria-hidden=true]]:rounded-(--radius-md) [&>span[aria-hidden=true]]:bg-(--color-primary-soft) [&>span[aria-hidden=true]]:text-(--color-primary-strong)",
    icon: <Icon name="plus" />,
    action: (
      <Button variant="secondary">
        <Icon name="plus" />
        Create trip
      </Button>
    ),
  },
};

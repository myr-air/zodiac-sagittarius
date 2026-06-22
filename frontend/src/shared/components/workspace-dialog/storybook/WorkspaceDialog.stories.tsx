import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "@/src/ui";
import { WorkspaceConfirmDialog } from "../WorkspaceConfirmDialog";
import { WorkspaceDialog } from "../WorkspaceDialog";
import { workspaceDialogActionsClassName, workspaceDialogFormClassName } from "../workspace-dialog.styles";

const meta = {
  title: "Shared/WorkspaceDialog",
  component: WorkspaceDialog,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof WorkspaceDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const FormDialog: Story = {
  args: {
    ariaLabel: "Add booking",
    closeAriaLabel: "Close",
    formClassName: workspaceDialogFormClassName,
    onClose: () => undefined,
    onSubmit: (event) => event.preventDefault(),
    title: "Add booking",
  },
  render: (args) => (
    <WorkspaceDialog {...args}>
      <label className="grid gap-1 text-sm font-bold text-(--color-text)">
        Title
        <input className="min-h-10 rounded-(--radius-sm) border border-(--color-border) px-3" defaultValue="Hotel confirmation" />
      </label>
      <div className={workspaceDialogActionsClassName}>
        <Button type="button" variant="ghost">Cancel</Button>
        <Button type="submit">Save</Button>
      </div>
    </WorkspaceDialog>
  ),
};

export const ConfirmDialog: StoryObj<typeof WorkspaceConfirmDialog> = {
  render: () => (
    <WorkspaceConfirmDialog
      body="Delete Hotel confirmation? Related itinerary, todo, and expense records will stay in place."
      cancelLabel="Cancel"
      confirmLabel="Delete booking"
      onCancel={() => undefined}
      onConfirm={() => undefined}
      title="Delete booking"
      titleId="storybook-delete-booking-title"
      titleTone="danger"
    />
  ),
};

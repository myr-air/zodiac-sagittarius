import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "@/src/ui";
import { WorkspaceCompactFormDialog } from "../WorkspaceCompactFormDialog";
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

export const ConfirmPrimaryDialog: StoryObj<typeof WorkspaceConfirmDialog> = {
  render: () => (
    <WorkspaceConfirmDialog
      body="Switch identity from Explorer Friend? You will need to verify again to return."
      cancelLabel="Cancel"
      className="identity-switch-dialog w-[min(420px,100%)]"
      confirmLabel="Switch identity"
      confirmVariant="primary"
      onCancel={() => undefined}
      onConfirm={() => undefined}
      title="Switch identity"
      titleId="storybook-switch-identity-title"
    />
  ),
};

export const CompactFormDialog: StoryObj<typeof WorkspaceCompactFormDialog> = {
  render: () => (
    <WorkspaceCompactFormDialog
      actions={(
        <>
          <Button type="button" variant="ghost">Cancel</Button>
          <Button type="submit">Import itinerary</Button>
        </>
      )}
      className="import-options-dialog w-[min(520px,100%)]"
      onSubmit={(event) => event.preventDefault()}
      title="Import itinerary"
      titleId="storybook-import-options-title"
    >
      <p className="m-0 text-sm font-medium leading-6 text-(--color-text-muted)">
        4 itinerary items and 2 linked records are ready to import.
      </p>
      <label className="grid gap-1.5 text-sm font-bold text-(--color-text-muted)">
        Scope
        <select className="min-h-9 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-2.5 text-sm" defaultValue="trip">
          <option value="trip">Trip</option>
          <option value="day">Day</option>
        </select>
      </label>
    </WorkspaceCompactFormDialog>
  ),
};

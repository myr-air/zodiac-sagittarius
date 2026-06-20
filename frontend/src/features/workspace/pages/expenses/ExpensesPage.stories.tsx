import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent } from "storybook/test";
import { TripExpensesPage } from "./TripExpensesPage";
import {
  filteredLedgerPlay,
  planScopeAuditPlay,
} from "./ExpensesPage.stories.plays";
import {
  denseExpensesStoryArgs,
  emptyExpensesStoryArgs,
  expensesOwnerStoryArgs,
  expensesTravelerStoryArgs,
  expensesViewerStoryArgs,
  expectExpensesResponsiveContract,
  planScopeAuditExpensesStoryArgs,
} from "./ExpensesPage.stories.support";

const meta = {
  title: "Pages/Expenses",
  component: TripExpensesPage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof TripExpensesPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Owner: Story = {
  args: expensesOwnerStoryArgs,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("region", { name: /Trip money/i })).toHaveClass("expenses-page");
    await expect(canvas.getByRole("button", { name: /Add expense/i })).toBeEnabled();
  },
};

export const Traveler: Story = {
  args: expensesTravelerStoryArgs,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("region", { name: /Trip money/i })).toHaveClass("expenses-page");
    await expect(canvas.getByRole("button", { name: /Add expense/i })).toBeEnabled();
  },
};

export const Viewer: Story = {
  args: expensesViewerStoryArgs,
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Money view only/i)).toBeVisible();
    await expect(canvas.getByRole("button", { name: /Add expense/i })).toBeDisabled();
  },
};

export const OwnerThai: Story = {
  args: Owner.args,
  parameters: { locale: "th" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("region", { name: /เงินทริป/i })).toHaveClass("expenses-page");
    await expect(canvas.getByRole("region", { name: /สรุปเงิน/i })).toBeVisible();
    await expect(canvas.getByRole("button", { name: /เพิ่มค่าใช้จ่าย/i })).toBeEnabled();
  },
};

export const Dense: Story = {
  args: denseExpensesStoryArgs,
};

export const Empty: Story = {
  args: emptyExpensesStoryArgs,
};

export const AddExpenseDialogOpen: Story = {
  args: Owner.args,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: /Add expense/i }));
    await expect(canvas.getByRole("dialog", { name: /Add expense/i })).toHaveClass("expense-dialog");
    await expect(canvas.getByLabelText("Expense title")).toBeVisible();
    await expect(canvas.getByLabelText("Amount")).toBeVisible();
    await expect(canvas.getByRole("button", { name: /Save expense/i })).toBeDisabled();
  },
};

export const FilteredLedger: Story = {
  args: Owner.args,
  play: filteredLedgerPlay,
};

export const PlanScopeAudit: Story = {
  args: planScopeAuditExpensesStoryArgs,
  play: planScopeAuditPlay,
};

export const Tablet: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "tablet768" } },
  play: async ({ canvasElement }) => {
    await expectExpensesResponsiveContract(canvasElement);
  },
};

export const Desktop1024: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "desktop1024" } },
  play: async ({ canvasElement }) => {
    await expectExpensesResponsiveContract(canvasElement);
  },
};

export const Desktop1440: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "desktop1440" } },
  play: async ({ canvasElement }) => {
    await expectExpensesResponsiveContract(canvasElement);
  },
};

export const Mobile: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "mobile320" } },
  play: async ({ canvasElement }) => {
    await expectExpensesResponsiveContract(canvasElement);
  },
};

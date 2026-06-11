import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent } from "storybook/test";
import { buildDenseTripFixture, buildEmptyTripFixture, tripFixture } from "@/src/trip/trip-fixtures";
import { buildExpenseSummary } from "@/src/trip/expenses";
import { TripExpensesPage } from "./TripExpensesPage";

const noop = () => {};
const denseTrip = buildDenseTripFixture();
const emptyTrip = buildEmptyTripFixture();

const meta = {
  title: "Pages/Expenses",
  component: TripExpensesPage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof TripExpensesPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Owner: Story = {
  args: {
    trip: tripFixture.trip,
    currentMember: tripFixture.currentMembers.owner,
    expenseSummary: tripFixture.expenseSummaries.owner,
    canEditExpenses: true,
    onCreateExpense: noop,
    onUpdateExpense: noop,
    onDeleteExpense: noop,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("region", { name: /Trip money/i })).toHaveClass("expenses-page");
    await expect(canvas.getByRole("button", { name: /Add expense/i })).toBeEnabled();
  },
};

export const Traveler: Story = {
  args: {
    ...Owner.args,
    currentMember: tripFixture.currentMembers.traveler,
    expenseSummary: tripFixture.expenseSummaries.traveler,
  },
};

export const Viewer: Story = {
  args: {
    ...Owner.args,
    currentMember: tripFixture.currentMembers.viewer,
    expenseSummary: tripFixture.expenseSummaries.viewer,
    canEditExpenses: false,
  },
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
  args: {
    ...Owner.args,
    trip: denseTrip,
    currentMember: denseTrip.members[0],
    expenseSummary: buildExpenseSummary(denseTrip.expenses, denseTrip.members[0].id),
  },
};

export const Empty: Story = {
  args: {
    ...Owner.args,
    trip: emptyTrip,
    expenseSummary: buildExpenseSummary(emptyTrip.expenses, tripFixture.currentMembers.owner.id),
  },
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

export const Tablet: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "tablet768" } },
};

export const Desktop1024: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "desktop1024" } },
};

export const Desktop1440: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "desktop1440" } },
};

export const Mobile: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "mobile320" } },
};

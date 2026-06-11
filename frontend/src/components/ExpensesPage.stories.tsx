import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { tripFixture } from "@/src/trip/trip-fixtures";
import { TripExpensesPage } from "./TripExpensesPage";

const noop = () => {};

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
};

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { buildDenseTripFixture, buildEmptyTripFixture, tripFixture } from "@/src/trip/trip-fixtures";
import { buildExpenseSummary } from "@/src/trip/expenses";
import { TripExpensesPage } from "./TripExpensesPage";

const noop = () => {};
const onStoryUpdateExpense = fn();
const denseTrip = buildDenseTripFixture();
const emptyTrip = buildEmptyTripFixture();
const inferredScopeTrip = {
  ...tripFixture.trip,
  expenses: [
    {
      ...tripFixture.trip.expenses[0],
      tripPlanId: "plan-rain",
      itineraryItemId: null,
    },
  ],
};

const meta = {
  title: "Pages/Expenses",
  component: TripExpensesPage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof TripExpensesPage>;

export default meta;

type Story = StoryObj<typeof meta>;

async function expectExpensesResponsiveContract(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  await expect(canvas.getByRole("region", { name: /Trip money|เงินทริป/i })).toHaveClass("expenses-page");
  await expect(canvas.getByRole("region", { name: /Money summary|สรุปเงิน/i })).toBeVisible();
  await expect(canvas.getByRole("table", { name: /Expense ledger|รายการค่าใช้จ่าย/i })).toHaveClass("expense-ledger-table");
}

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
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("region", { name: /Trip money/i })).toHaveClass("expenses-page");
    await expect(canvas.getByRole("button", { name: /Add expense/i })).toBeEnabled();
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

export const FilteredLedger: Story = {
  args: Owner.args,
  play: async ({ canvas }) => {
    const ledger = canvas.getByRole("table", { name: /Expense ledger/i });
    await expect(ledger).toHaveClass("expense-ledger-table");

    await userEvent.type(canvas.getByLabelText(/Search expenses/i), "tram");
    await expect(canvas.getByText("Peak Tram tickets")).toBeVisible();
    await expect(canvas.queryByText("Dim Dim Sum brunch")).toBeNull();

    await userEvent.selectOptions(canvas.getByLabelText("Category"), "transport");
    await expect(canvas.getByText(/No expenses match this filter/i)).toBeVisible();

    await userEvent.click(canvas.getByRole("button", { name: /Clear filters/i }));
    await expect(canvas.getByText("Dim Dim Sum brunch")).toBeVisible();
    await expect(canvas.getByText("Octopus top-up")).toBeVisible();
  },
};

export const PlanScopeAudit: Story = {
  args: {
    ...Owner.args,
    trip: inferredScopeTrip,
    expenseSummary: buildExpenseSummary(inferredScopeTrip.expenses, tripFixture.currentMembers.owner.id),
    onUpdateExpense: onStoryUpdateExpense,
  },
  play: async ({ canvas }) => {
    onStoryUpdateExpense.mockClear();
    const audit = canvas.getByRole("region", { name: /Plan scope audit/i });
    await expect(audit).toHaveTextContent("Dim Dim Sum brunch");
    await expect(audit).toHaveTextContent("Inferred scope: แผนฝนตก");

    await userEvent.click(
      within(audit).getByRole("button", {
        name: /Review scope for Dim Dim Sum brunch/i,
      }),
    );
    const dialog = canvas.getByRole("dialog", { name: /Edit expense/i });
    await expect(within(dialog).getByLabelText("Trip Plan")).toHaveValue("plan-rain");
  },
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

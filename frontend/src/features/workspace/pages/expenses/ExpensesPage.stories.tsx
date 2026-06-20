import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TripExpensesPage } from "./TripExpensesPage";
import {
  addExpenseDialogOpenPlay,
  filteredLedgerPlay,
  ownerPlay,
  ownerThaiPlay,
  planScopeAuditPlay,
  responsivePlay,
  viewerPlay,
} from "./ExpensesPage.stories.plays";
import {
  denseExpensesStoryArgs,
  emptyExpensesStoryArgs,
  expensesOwnerStoryArgs,
  expensesTravelerStoryArgs,
  expensesViewerStoryArgs,
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
  play: ownerPlay,
};

export const Traveler: Story = {
  args: expensesTravelerStoryArgs,
  play: ownerPlay,
};

export const Viewer: Story = {
  args: expensesViewerStoryArgs,
  play: viewerPlay,
};

export const OwnerThai: Story = {
  args: Owner.args,
  parameters: { locale: "th" },
  play: ownerThaiPlay,
};

export const Dense: Story = {
  args: denseExpensesStoryArgs,
};

export const Empty: Story = {
  args: emptyExpensesStoryArgs,
};

export const AddExpenseDialogOpen: Story = {
  args: Owner.args,
  play: addExpenseDialogOpenPlay,
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
  play: responsivePlay,
};

export const Desktop1024: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "desktop1024" } },
  play: responsivePlay,
};

export const Desktop1440: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "desktop1440" } },
  play: responsivePlay,
};

export const Mobile: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "mobile320" } },
  play: responsivePlay,
};

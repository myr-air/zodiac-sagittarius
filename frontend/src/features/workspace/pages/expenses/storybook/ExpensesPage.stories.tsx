import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  ownerArgsStory,
  viewportStory,
} from "@/src/shared/storybook/story-builders";
import { TripExpensesPage } from "../TripExpensesPage";
import {
  addExpenseDialogOpenPlay,
  filteredLedgerPlay,
  mobileEditDialogLayerPlay,
  ownerPlay,
  ownerThaiPlay,
  planScopeAuditPlay,
  responsivePlay,
  settingsTabPlay,
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
const ownerStory = ownerArgsStory<Story>;
const viewportStoryForOwner = viewportStory<Story>;

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

export const OwnerThai: Story = ownerStory(Owner.args, {}, ownerThaiPlay, {
  locale: "th",
});

export const Dense: Story = {
  args: denseExpensesStoryArgs,
};

export const Empty: Story = {
  args: emptyExpensesStoryArgs,
};

export const AddExpenseDialogOpen: Story = ownerStory(
  Owner.args,
  {},
  addExpenseDialogOpenPlay,
);

export const FilteredLedger: Story = ownerStory(
  Owner.args,
  {},
  filteredLedgerPlay,
);

export const SettingsTab: Story = ownerStory(
  Owner.args,
  {},
  settingsTabPlay,
);

export const PlanScopeAudit: Story = {
  args: planScopeAuditExpensesStoryArgs,
  play: planScopeAuditPlay,
};

export const Tablet: Story = viewportStoryForOwner(
  Owner.args,
  "tablet768",
  responsivePlay,
);

export const Desktop1024: Story = viewportStoryForOwner(
  Owner.args,
  "desktop1024",
  responsivePlay,
);

export const Desktop1440: Story = viewportStoryForOwner(
  Owner.args,
  "desktop1440",
  responsivePlay,
);

export const Mobile: Story = viewportStoryForOwner(
  Owner.args,
  "mobile320",
  responsivePlay,
);

export const MobileEditDialogLayer: Story = viewportStoryForOwner(
  Owner.args,
  "mobile320",
  mobileEditDialogLayerPlay,
);

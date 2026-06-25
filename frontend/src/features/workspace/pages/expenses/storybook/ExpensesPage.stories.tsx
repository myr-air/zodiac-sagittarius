import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  ownerArgsStory,
  viewportStory,
} from "@/src/shared/storybook/story-builders";
import { TripExpensesPage } from "../TripExpensesPage";
import {
  addExpenseDialogOpenPlay,
  accountMobilePlay,
  filteredLedgerPlay,
  itemizedHeavyDialogPlay,
  mobileEditDialogLayerPlay,
  ownerPlay,
  ownerThaiPlay,
  planScopeAuditPlay,
  responsivePlay,
  settingsTabPlay,
  travelerPlay,
  viewerPlay,
} from "./ExpensesPage.stories.plays";
import {
  denseExpensesStoryArgs,
  denseLongNamesMobileStoryArgs,
  emptyExpensesStoryArgs,
  expensesOwnerStoryArgs,
  expensesTravelerStoryArgs,
  expensesViewerStoryArgs,
  itemizedHeavyStoryArgs,
  longExpenseOverflowStoryArgs,
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
  play: travelerPlay,
};

export const Viewer: Story = {
  args: expensesViewerStoryArgs,
  play: viewerPlay,
};

export const OwnerThai: Story = ownerStory(Owner.args, {}, ownerThaiPlay, {
  locale: "th",
});

export const ThaiMobileFull: Story = viewportStoryForOwner(
  OwnerThai.args,
  "mobile320",
  responsivePlay,
);

export const Dense: Story = {
  args: denseExpensesStoryArgs,
};

export const DenseLongNamesMobile: Story = viewportStoryForOwner(
  denseLongNamesMobileStoryArgs,
  "mobile320",
  responsivePlay,
);

export const AccountMobile: Story = viewportStoryForOwner(
  Owner.args,
  "mobile320",
  accountMobilePlay,
);

export const ItemizedHeavyDialogMobile: Story = viewportStoryForOwner(
  itemizedHeavyStoryArgs,
  "mobile320",
  itemizedHeavyDialogPlay,
);

export const LongExpenseOverflowMobile: Story = viewportStoryForOwner(
  longExpenseOverflowStoryArgs,
  "mobile320",
  responsivePlay,
);

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

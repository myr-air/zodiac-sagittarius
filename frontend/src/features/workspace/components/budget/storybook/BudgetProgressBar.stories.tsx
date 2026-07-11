import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BudgetProgressBar } from "../BudgetProgressBar";

const meta = {
  title: "Design System/Budget Progress Bar",
  component: BudgetProgressBar,
  parameters: { layout: "padded" },
  tags: ["ai-generated"],
} satisfies Meta<typeof BudgetProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const UnderBudget: Story = { args: { spent: 400, max: 1000 } };
export const ApproachingLimit: Story = { args: { spent: 850, max: 1000 } };
export const OverBudget: Story = { args: { spent: 1200, max: 1000 } };
export const Thai: Story = {
  args: { spent: 15000, max: 30000 },
  parameters: { locale: "th" },
};

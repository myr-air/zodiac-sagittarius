import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expenseCategories } from "../model/expense-page-options";
import { ExpenseCategoryBadge } from "../components/ExpenseCategoryBadge";

const meta = {
  title: "Pages/Expenses/ExpenseCategoryBadge",
  component: ExpenseCategoryBadge,
  parameters: { layout: "centered" },
  args: {
    category: "food",
  },
} satisfies Meta<typeof ExpenseCategoryBadge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Food: Story = {};

export const Transport: Story = {
  args: { category: "transport" },
};

export const AllCategories: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {expenseCategories.map((category) => (
        <ExpenseCategoryBadge category={category} key={category} />
      ))}
    </div>
  ),
};

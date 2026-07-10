import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BudgetCategoryCard } from "../BudgetCategoryCard";
import type { BudgetCategory } from "@/src/trip/types";

const sampleCategory: BudgetCategory = {
  id: "cat-1",
  tripId: "trip-1",
  category: "Flights",
  estimated: 5000,
  actual: 3200,
};

const meta = {
  title: "Design System/Budget Category Card",
  component: BudgetCategoryCard,
  parameters: { layout: "padded" },
  tags: ["ai-generated"],
  argTypes: { onEdit: { action: "onEdit" } },
} satisfies Meta<typeof BudgetCategoryCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { category: sampleCategory, onEdit: () => {} },
};

export const ApproachingBudget: Story = {
  args: {
    category: { ...sampleCategory, estimated: 5000, actual: 4500 },
    onEdit: () => {},
  },
};

export const Thai: Story = {
  args: {
    category: { ...sampleCategory, category: "ตั๋วเครื่องบิน" },
    onEdit: () => {},
  },
  parameters: { locale: "th" },
};

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ExpenseMemberLine } from "../components/ExpenseMemberLine";

const meta = {
  title: "Pages/Expenses/ExpenseMemberLine",
  component: ExpenseMemberLine,
  parameters: { layout: "centered" },
  args: {
    color: "#2563eb",
    name: "Aom",
  },
} satisfies Meta<typeof ExpenseMemberLine>;

export default meta;

type Story = StoryObj<typeof meta>;

export const NameOnly: Story = {};

export const WithBalanceMeta: Story = {
  args: {
    color: "#0f766e",
    name: "Demo Traveler",
    meta: "gets back HK$25.00",
  },
};

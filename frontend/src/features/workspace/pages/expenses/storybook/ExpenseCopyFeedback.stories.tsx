import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { enMessages } from "@/src/i18n/messages/en";
import { ExpenseCopyFeedback } from "../components/ExpenseCopyFeedback";

const meta = {
  title: "Pages/Expenses/ExpenseCopyFeedback",
  component: ExpenseCopyFeedback,
  parameters: { layout: "centered" },
  args: {
    copyState: "idle",
    t: enMessages,
  },
} satisfies Meta<typeof ExpenseCopyFeedback>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Ready: Story = {};

export const Copied: Story = {
  args: { copyState: "copied" },
};

export const Error: Story = {
  args: { copyState: "error" },
};

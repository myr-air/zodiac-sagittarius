import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { enMessages } from "@/src/i18n/messages/en";
import { MemberCopyFeedback } from "../components/MemberCopyFeedback";

const meta = {
  title: "Pages/Members/MemberCopyFeedback",
  component: MemberCopyFeedback,
  parameters: { layout: "centered" },
  args: {
    copyState: "idle",
    labels: enMessages,
  },
} satisfies Meta<typeof MemberCopyFeedback>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Ready: Story = {};

export const Copied: Story = {
  args: { copyState: "copied" },
};

export const Error: Story = {
  args: { copyState: "error" },
};

export const ReadOnly: Story = {
  args: { readOnly: true },
};

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PersonAvatar } from "../PersonAvatar";

const meta = {
  title: "Design System/Person Avatar",
  component: PersonAvatar,
  parameters: { layout: "centered" },
  args: {
    className: "grid size-[34px] place-items-center rounded-full text-sm font-extrabold text-white",
    color: "#2563eb",
    name: "Aom",
  },
} satisfies Meta<typeof PersonAvatar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const EmptyNameFallback: Story = {
  args: {
    name: "",
  },
};

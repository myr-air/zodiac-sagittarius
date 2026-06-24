import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ExternalLinkAction } from "../ExternalLinkAction";

const meta = {
  title: "Shared/ExternalLinkAction",
  component: ExternalLinkAction,
  parameters: { layout: "centered" },
  args: {
    buttonVariant: "ghost",
    className: "w-auto",
    href: "https://example.test/travel-doc",
    openLabel: "Open travel doc",
  },
} satisfies Meta<typeof ExternalLinkAction>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ButtonLink: Story = {};

export const InlineLink: Story = {
  args: {
    className: "inline-flex min-h-9 items-center gap-2 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-2.5 text-sm font-extrabold text-(--color-primary-strong)",
    iconPosition: "start",
    variant: "inline",
  },
};

export const IconOnly: Story = {
  args: {
    className: "grid size-8 place-items-center rounded-(--radius-sm) text-(--color-primary-strong) hover:bg-(--color-primary-soft)",
    variant: "icon",
  },
};

export const BlockedNotice: Story = {
  args: {
    blockedLabel: "Unsafe link blocked",
    blockedMode: "notice",
    href: null,
  },
};

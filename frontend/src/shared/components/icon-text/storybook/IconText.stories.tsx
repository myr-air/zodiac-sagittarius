import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { IconText } from "../IconText";

const meta = {
  title: "Design System/Icon Text",
  component: IconText,
  tags: ["ai-generated"],
  args: {
    children: "4 active travelers",
    className: "inline-flex items-center gap-1.5 text-sm font-bold text-(--color-text-muted)",
    icon: "users",
  },
} satisfies Meta<typeof IconText>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const TripFacts: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <IconText className="inline-flex items-center gap-1.5 text-sm font-bold text-(--color-text-muted)" icon="calendar">
        May 28 - Jun 2
      </IconText>
      <IconText className="inline-flex items-center gap-1.5 text-sm font-bold text-(--color-text-muted)" icon="location">
        Hong Kong
      </IconText>
      <IconText className="inline-flex items-center gap-1.5 text-sm font-bold text-(--color-text-muted)" icon="wallet">
        HK$2,300
      </IconText>
    </div>
  ),
};

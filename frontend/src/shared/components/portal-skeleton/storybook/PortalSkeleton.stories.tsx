import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  PortalSkeleton,
  portalSkeletonVariantValues,
} from "../PortalSkeleton";

const meta = {
  title: "Design System/Portal Skeleton",
  component: PortalSkeleton,
  tags: ["ai-generated"],
} satisfies Meta<typeof PortalSkeleton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Variants: Story = {
  args: {
    variant: "title",
  },
  render: () => (
    <div className="grid w-[min(520px,100%)] gap-3 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-4">
      {portalSkeletonVariantValues.map((variant) => (
        <PortalSkeleton key={variant} variant={variant} />
      ))}
    </div>
  ),
};

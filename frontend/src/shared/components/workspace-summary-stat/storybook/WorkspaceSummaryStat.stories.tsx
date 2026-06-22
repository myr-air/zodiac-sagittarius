import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  WorkspaceSummaryStat,
  workspaceSummaryStatToneValues,
} from "../WorkspaceSummaryStat";

const meta = {
  title: "Design System/Workspace Summary Stat",
  component: WorkspaceSummaryStat,
  tags: ["ai-generated"],
} satisfies Meta<typeof WorkspaceSummaryStat>;

export default meta;

type Story = StoryObj<typeof meta>;

const statClassName =
  "grid min-h-[104px] w-[240px] gap-1 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) p-3.5 shadow-[0_1px_0_rgb(15_23_42_/_0.04)] [&_.icon]:text-(--color-primary) [&>span]:text-xs [&>span]:font-bold [&>span]:text-(--color-text-muted) [&>strong]:text-2xl [&>strong]:font-extrabold [&>strong]:tabular-nums [&>strong]:text-(--color-text)";

const valueFirstStatClassName =
  "grid min-h-[66px] w-[180px] content-center gap-0.5 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface-subtle) p-2.5 [&_span]:text-xs [&_span]:font-extrabold [&_span]:text-(--color-text-muted) [&_strong]:text-2xl [&_strong]:leading-7 [&_strong]:text-(--color-text)";

const valueToneClassNames = {
  positive: "text-[#15803d]",
  negative: "text-[#b91c1c]",
  neutral: "text-(--color-text)",
};

export const Default: Story = {
  args: {
    className: statClassName,
    icon: "wallet",
    label: "Trip spend",
    value: "$2,430",
  },
};

export const Positive: Story = {
  args: {
    ...Default.args,
    icon: "check",
    label: "Your balance",
    tone: "positive",
    value: "+$120",
    valueToneClassNames,
  },
};

export const Negative: Story = {
  args: {
    ...Default.args,
    icon: "warning",
    label: "You owe",
    tone: "negative",
    value: "$48",
    valueToneClassNames,
  },
};

export const ValueFirst: Story = {
  args: {
    className: valueFirstStatClassName,
    label: "Owned",
    value: "3",
    valueFirst: true,
  },
};

export const AllTones: Story = {
  args: {
    className: statClassName,
    icon: "wallet",
    label: "Trip spend",
    value: "$2,430",
  },
  render: () => (
    <div className="flex flex-wrap gap-3">
      {workspaceSummaryStatToneValues.map((tone) => (
        <WorkspaceSummaryStat
          className={statClassName}
          icon={tone === "positive" ? "check" : tone === "negative" ? "warning" : "wallet"}
          key={tone}
          label={`${tone} balance`}
          tone={tone}
          value={tone === "positive" ? "+$120" : tone === "negative" ? "$48" : "$0"}
          valueToneClassNames={valueToneClassNames}
        />
      ))}
    </div>
  ),
};

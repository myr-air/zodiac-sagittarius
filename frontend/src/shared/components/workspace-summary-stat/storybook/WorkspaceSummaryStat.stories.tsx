import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  WorkspaceSummaryStat,
  workspaceSummaryStatToneValues,
} from "../WorkspaceSummaryStat";
import {
  workspaceSummaryStatPrimaryAccentClassName as workspaceSummaryStatPrimaryAccentStyleClassName,
  workspaceSummaryStatValueFirstClassName as workspaceSummaryStatValueFirstStyleClassName,
} from "../WorkspaceSummaryStat.styles";

const meta = {
  title: "Design System/Workspace Summary Stat",
  component: WorkspaceSummaryStat,
  tags: ["ai-generated"],
} satisfies Meta<typeof WorkspaceSummaryStat>;

export default meta;

type Story = StoryObj<typeof meta>;

const statClassName = `w-[240px] ${workspaceSummaryStatPrimaryAccentStyleClassName}`;

const valueFirstStatClassName = workspaceSummaryStatValueFirstStyleClassName;

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

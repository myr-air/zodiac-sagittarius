import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Select } from "@/src/ui";
import { SelectOptions } from "../SelectOptions";

const meta = {
  title: "Design System/Select Options",
  component: SelectOptions,
  tags: ["ai-generated"],
} satisfies Meta<typeof SelectOptions>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    options: [
      { value: "plan-main", label: "Main" },
      { value: "plan-rain", label: "Rain plan" },
      { value: "plan-food", label: "Food crawl" },
    ],
  },
  render: (args) => (
    <label className="grid max-w-xs gap-2 text-sm font-bold text-(--color-text)">
      Trip Plan
      <Select defaultValue="plan-rain">
        <SelectOptions options={args.options} />
      </Select>
    </label>
  ),
};

export const WithEmptyOption: Story = {
  args: {
    options: [
      { value: "member-aom", label: "Aom" },
      { value: "member-beam", label: "Beam" },
    ],
  },
  render: (args) => (
    <label className="grid max-w-xs gap-2 text-sm font-bold text-(--color-text)">
      Owner
      <Select defaultValue="">
        <option value="">No owner</option>
        <SelectOptions options={args.options} />
      </Select>
    </label>
  ),
};

export const WithDisabledOption: Story = {
  args: {
    options: [
      { value: "main", label: "Main", disabled: true },
      { value: "draft", label: "Draft" },
      { value: "backup", label: "Backup" },
    ],
  },
  render: (args) => (
    <label className="grid max-w-xs gap-2 text-sm font-bold text-(--color-text)">
      Status
      <Select defaultValue="draft">
        <SelectOptions options={args.options} />
      </Select>
    </label>
  ),
};

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import type { InlineOptionPickerOption } from "./InlineOptionPicker";
import { InlineOptionPicker } from "./InlineOptionPicker";
import type { ComponentProps } from "react";

const sampleOptions: InlineOptionPickerOption[] = [
  { icon: "route", label: "Travel", value: "travel" },
  { icon: "utensils", label: "Food", value: "food" },
  { icon: "wallet", label: "Shopping", value: "shopping" },
];

const travelSubOptions: InlineOptionPickerOption[] = [
  { icon: "plane", label: "Flight", value: "flight" },
  { icon: "bus", label: "Bus", value: "bus" },
  { icon: "train", label: "Train", value: "train" },
];

const StoryRenderer = (args: ComponentProps<typeof InlineOptionPicker>) => {
  const [value, setValue] = useState(args.value);
  const [selectedSubValue, setSelectedSubValue] = useState(args.selectedSubValue ?? "");

  return (
    <div className="w-72">
      <InlineOptionPicker
        {...args}
        value={value}
        selectedSubValue={selectedSubValue}
        onCommit={(nextValue) => {
          setValue(nextValue);
          setSelectedSubValue("");
          args.onCommit?.(nextValue);
        }}
        onCommitSubOption={(nextValue, nextSubValue) => {
          setValue(nextValue);
          setSelectedSubValue(nextSubValue);
          args.onCommitSubOption?.(nextValue, nextSubValue);
        }}
      />
    </div>
  );
};

const meta = {
  title: "Design System/Inline Option Picker",
  component: InlineOptionPicker,
  parameters: { layout: "centered" },
  render: StoryRenderer,
  args: {
    ariaLabel: "Choose type",
    onCommit: fn(),
    onCommitSubOption: fn(),
  },
} satisfies Meta<typeof InlineOptionPicker>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    options: sampleOptions,
    value: "travel",
  },
};

export const WithTravelSuboptions: Story = {
  args: {
    options: sampleOptions,
    value: "travel",
    subOptionsByValue: {
      travel: travelSubOptions,
    },
  },
};

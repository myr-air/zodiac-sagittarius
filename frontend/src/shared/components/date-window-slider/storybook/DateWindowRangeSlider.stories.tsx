import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DateWindowRangeSlider } from "../DateWindowRangeSlider";

const meta = {
  title: "Design System/Date Window Range Slider",
  component: DateWindowRangeSlider,
  parameters: { layout: "padded" },
  tags: ["ai-generated"],
  argTypes: {
    onChange: { action: "onChange" },
  },
} satisfies Meta<typeof DateWindowRangeSlider>;

export default meta;

type Story = StoryObj<typeof meta>;

const defaultArgs = {
  minDate: "2026-01-01",
  maxDate: "2026-12-01",
  start: "2026-03-01",
  end: "2026-09-01",
};

export const Default: Story = {
  args: { ...defaultArgs, onChange: () => {} },
};

export const Edges: Story = {
  args: {
    ...defaultArgs,
    start: "2026-01-01",
    end: "2026-12-01",
    onChange: () => {},
  },
};

export const NarrowViewport: Story = {
  args: { ...defaultArgs, onChange: () => {} },
  parameters: {
    viewport: { defaultViewport: "mobile1" },
  },
};

export const Thai: Story = {
  args: {
    ...defaultArgs,
    ariaLabelStart: "ช่วงเริ่มต้น",
    ariaLabelEnd: "ช่วงสิ้นสุด",
    onChange: () => {},
  },
  parameters: { locale: "th" },
};

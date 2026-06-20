import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  datePickerPlay,
  dateTimeDialogPlay,
  dateTimePickerPlay,
  desktop1440Play,
  disabledPlay,
  thaiPlay,
  timePickerPlay,
} from "./DateTimePickers.stories.plays";
import { PickerStory } from "./DateTimePickers.stories.support";

const meta = {
  title: "Design System/Date Time Pickers",
  component: PickerStory,
  parameters: { layout: "fullscreen" },
  args: {
    disabled: false,
    kind: "time",
    label: "Start time",
    value: "09:00",
  },
} satisfies Meta<typeof PickerStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const TimePicker: Story = {
  args: {
    kind: "time",
    label: "Start time",
    value: "09:00",
  },
  play: timePickerPlay,
};

export const DatePicker: Story = {
  args: {
    kind: "date",
    label: "Trip start date",
    value: "2026-06-18",
  },
  play: datePickerPlay,
};

export const DateTimePicker: Story = {
  args: {
    kind: "datetime",
    label: "Booking starts",
    value: "2026-06-18T09:00",
  },
  play: dateTimePickerPlay,
};

export const Disabled: Story = {
  args: {
    disabled: true,
    kind: "date",
    label: "Disabled trip date",
    value: "2026-06-18",
  },
  play: disabledPlay,
};

export const Mobile: Story = {
  args: DateTimePicker.args,
  parameters: { viewport: { defaultViewport: "mobile320" } },
  play: dateTimeDialogPlay,
};

export const Tablet: Story = {
  args: DateTimePicker.args,
  parameters: { viewport: { defaultViewport: "tablet768" } },
  play: dateTimeDialogPlay,
};

export const Thai: Story = {
  args: {
    kind: "datetime",
    label: "เวลาเริ่มการจอง",
    value: "2026-06-18T09:00",
  },
  parameters: { locale: "th" },
  play: thaiPlay,
};

export const Desktop1024: Story = {
  args: DateTimePicker.args,
  parameters: { viewport: { defaultViewport: "desktop1024" } },
  play: dateTimeDialogPlay,
};

export const Desktop1440: Story = {
  args: DatePicker.args,
  parameters: { viewport: { defaultViewport: "desktop1440" } },
  play: desktop1440Play,
};

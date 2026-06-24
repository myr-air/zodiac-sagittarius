import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  argsStory,
  viewportStory,
} from "@/src/shared/storybook/story-builders";
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
const pickerStory = argsStory<Story>;
const viewportStoryForPicker = viewportStory<Story>;

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

const dateTimePickerArgs = DateTimePicker.args ?? {};
const datePickerArgs = DatePicker.args ?? {};

export const Disabled: Story = {
  args: {
    disabled: true,
    kind: "date",
    label: "Disabled trip date",
    value: "2026-06-18",
  },
  play: disabledPlay,
};

export const Mobile: Story = viewportStoryForPicker(
  dateTimePickerArgs,
  "mobile320",
  dateTimeDialogPlay,
);

export const Tablet: Story = viewportStoryForPicker(
  dateTimePickerArgs,
  "tablet768",
  dateTimeDialogPlay,
);

export const Thai: Story = pickerStory(
  {},
  {
    kind: "datetime",
    label: "เวลาเริ่มการจอง",
    value: "2026-06-18T09:00",
  },
  thaiPlay,
  { locale: "th" },
);

export const Desktop1024: Story = viewportStoryForPicker(
  dateTimePickerArgs,
  "desktop1024",
  dateTimeDialogPlay,
);

export const Desktop1440: Story = viewportStoryForPicker(
  datePickerArgs,
  "desktop1440",
  desktop1440Play,
);

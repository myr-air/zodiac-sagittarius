import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
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
  play: async ({ canvas, canvasElement }) => {
    await userEvent.click(canvas.getByRole("button", { name: /Open time picker/i }));
    const body = within(canvasElement.ownerDocument.body);
    await expect(body.getByRole("dialog", { name: /Joii date time picker/i })).toBeVisible();
    await userEvent.click(body.getByRole("button", { name: "14:00" }));
    await expect(canvas.getByLabelText("Start time")).toHaveValue("14:00");
    await expect(body.queryByRole("dialog", { name: /Joii date time picker/i })).toBeNull();
  },
};

export const DatePicker: Story = {
  args: {
    kind: "date",
    label: "Trip start date",
    value: "2026-06-18",
  },
  play: async ({ canvas, canvasElement }) => {
    await userEvent.click(canvas.getByRole("button", { name: /Open date picker/i }));
    const body = within(canvasElement.ownerDocument.body);
    await expect(body.getByRole("dialog", { name: /Joii date time picker/i })).toBeVisible();
    await expect(body.getByText("June 2026")).toBeVisible();
    await userEvent.click(body.getByRole("button", { name: "20" }));
    await expect(canvas.getByLabelText("Trip start date")).toHaveValue("2026-06-20");
  },
};

export const DateTimePicker: Story = {
  args: {
    kind: "datetime",
    label: "Booking starts",
    value: "2026-06-18T09:00",
  },
  play: async ({ canvas, canvasElement }) => {
    await userEvent.click(canvas.getByRole("button", { name: /Open date and time picker/i }));
    const body = within(canvasElement.ownerDocument.body);
    await expect(body.getByRole("dialog", { name: /Joii date time picker/i })).toBeVisible();
    await userEvent.click(body.getByRole("button", { name: "22" }));
    await userEvent.click(body.getByRole("button", { name: "15:00" }));
    await expect(canvas.getByLabelText("Booking starts")).toHaveValue("2026-06-22T15:00");
    await userEvent.click(body.getByRole("button", { name: "Apply" }));
    await expect(body.queryByRole("dialog", { name: /Joii date time picker/i })).toBeNull();
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    kind: "date",
    label: "Disabled trip date",
    value: "2026-06-18",
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText("Disabled trip date")).toBeDisabled();
    await expect(canvas.getByRole("button", { name: /Open date picker/i })).toBeDisabled();
  },
};

export const Mobile: Story = {
  args: DateTimePicker.args,
  parameters: { viewport: { defaultViewport: "mobile320" } },
  play: async ({ canvas, canvasElement }) => {
    await userEvent.click(canvas.getByRole("button", { name: /Open date and time picker/i }));
    const body = within(canvasElement.ownerDocument.body);
    await expect(body.getByRole("dialog", { name: /Joii date time picker/i })).toBeVisible();
    await expect(body.getByRole("button", { name: "Apply" })).toBeVisible();
  },
};

export const Tablet: Story = {
  args: DateTimePicker.args,
  parameters: { viewport: { defaultViewport: "tablet768" } },
  play: async ({ canvas, canvasElement }) => {
    await userEvent.click(canvas.getByRole("button", { name: /Open date and time picker/i }));
    const body = within(canvasElement.ownerDocument.body);
    await expect(body.getByRole("dialog", { name: /Joii date time picker/i })).toBeVisible();
    await expect(body.getByRole("button", { name: "Apply" })).toBeVisible();
  },
};

export const Thai: Story = {
  args: {
    kind: "datetime",
    label: "เวลาเริ่มการจอง",
    value: "2026-06-18T09:00",
  },
  parameters: { locale: "th" },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByLabelText("เวลาเริ่มการจอง")).toHaveValue("2026-06-18T09:00");
    await userEvent.click(canvas.getByRole("button", { name: /Open date and time picker/i }));
    const body = within(canvasElement.ownerDocument.body);
    await expect(body.getByRole("dialog", { name: /Joii date time picker/i })).toBeVisible();
    await expect(body.getByText("June 2026")).toBeVisible();
  },
};

export const Desktop1024: Story = {
  args: DateTimePicker.args,
  parameters: { viewport: { defaultViewport: "desktop1024" } },
  play: async ({ canvas, canvasElement }) => {
    await userEvent.click(canvas.getByRole("button", { name: /Open date and time picker/i }));
    const body = within(canvasElement.ownerDocument.body);
    await expect(body.getByRole("dialog", { name: /Joii date time picker/i })).toBeVisible();
    await expect(body.getByRole("button", { name: "Apply" })).toBeVisible();
  },
};

export const Desktop1440: Story = {
  args: DatePicker.args,
  parameters: { viewport: { defaultViewport: "desktop1440" } },
  play: async ({ canvas, canvasElement }) => {
    await userEvent.click(canvas.getByRole("button", { name: /Open date picker/i }));
    const body = within(canvasElement.ownerDocument.body);
    await expect(body.getByRole("dialog", { name: /Joii date time picker/i })).toBeVisible();
    await expect(body.getByText("June 2026")).toBeVisible();
  },
};

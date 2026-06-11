import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { DatePickerField, DateTimePickerField, TimePickerField } from "./DateTimePickers";

type PickerKind = "date" | "time" | "datetime";

interface PickerStoryProps {
  disabled?: boolean;
  kind: PickerKind;
  label: string;
  value: string;
}

const fieldShellClassName =
  "grid w-full max-w-[380px] gap-2 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-4 shadow-[0_10px_22px_rgb(55_47_38_/_0.04)]";
const labelClassName = "grid gap-1.5 text-[13px] font-bold text-(--color-text-muted)";
const inputClassName =
  "min-h-11 w-full rounded-(--radius-md) border border-(--color-border-strong) bg-(--color-surface) px-3 text-sm font-semibold text-(--color-text)";
const valueClassName = "text-xs font-extrabold text-(--color-text-muted)";

function PickerStory({ disabled = false, kind, label, value: initialValue }: PickerStoryProps) {
  const [value, setValue] = useState(initialValue);

  return (
    <div className="grid min-h-[460px] place-items-start bg-(--color-page) p-8">
      <div className={fieldShellClassName}>
        <label className={labelClassName}>
          <span>{label}</span>
          {kind === "time" ? (
            <TimePickerField
              aria-label={label}
              className={inputClassName}
              disabled={disabled}
              value={value}
              onChange={setValue}
            />
          ) : null}
          {kind === "date" ? (
            <DatePickerField
              aria-label={label}
              className={inputClassName}
              disabled={disabled}
              value={value}
              onChange={setValue}
            />
          ) : null}
          {kind === "datetime" ? (
            <DateTimePickerField className={inputClassName} disabled={disabled} value={value} onChange={setValue} />
          ) : null}
        </label>
        <span className={valueClassName}>Selected: {value}</span>
      </div>
    </div>
  );
}

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

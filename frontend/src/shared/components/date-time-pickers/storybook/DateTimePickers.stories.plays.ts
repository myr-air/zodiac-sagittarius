import type { StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import type { PickerStory } from "./DateTimePickers.stories.support";

type PickerStoryPlay = NonNullable<StoryObj<typeof PickerStory>["play"]>;

function getDocumentCanvas(canvasElement: HTMLElement) {
  return within(canvasElement.ownerDocument.body);
}

async function openPickerDialog({
  buttonName,
  canvas,
  canvasElement,
}: {
  buttonName: RegExp;
  canvas: Parameters<PickerStoryPlay>[0]["canvas"];
  canvasElement: HTMLElement;
}) {
  await userEvent.click(canvas.getByRole("button", { name: buttonName }));
  const body = getDocumentCanvas(canvasElement);
  await expect(body.getByRole("dialog", { name: /Joii date time picker/i })).toBeVisible();
  return body;
}

export const timePickerPlay: PickerStoryPlay = async ({ canvas, canvasElement }) => {
  const body = await openPickerDialog({
    buttonName: /Open time picker/i,
    canvas,
    canvasElement,
  });
  await userEvent.click(body.getByRole("button", { name: "14:00" }));
  await expect(canvas.getByLabelText("Start time")).toHaveValue("14:00");
  await expect(body.queryByRole("dialog", { name: /Joii date time picker/i })).toBeNull();
};

export const datePickerPlay: PickerStoryPlay = async ({ canvas, canvasElement }) => {
  const body = await openPickerDialog({
    buttonName: /Open date picker/i,
    canvas,
    canvasElement,
  });
  await expect(body.getByText("June 2026")).toBeVisible();
  await userEvent.click(body.getByRole("button", { name: "20" }));
  await expect(canvas.getByLabelText("Trip start date")).toHaveValue("2026-06-20");
};

export const dateTimePickerPlay: PickerStoryPlay = async ({ canvas, canvasElement }) => {
  const body = await openPickerDialog({
    buttonName: /Open date and time picker/i,
    canvas,
    canvasElement,
  });
  await userEvent.click(body.getByRole("button", { name: "22" }));
  await userEvent.click(body.getByRole("button", { name: "15:00" }));
  await expect(canvas.getByLabelText("Booking starts")).toHaveValue("2026-06-22T15:00");
  await userEvent.click(body.getByRole("button", { name: "Apply" }));
  await expect(body.queryByRole("dialog", { name: /Joii date time picker/i })).toBeNull();
};

export const disabledPlay: PickerStoryPlay = async ({ canvas }) => {
  await expect(canvas.getByLabelText("Disabled trip date")).toBeDisabled();
  await expect(canvas.getByRole("button", { name: /Open date picker/i })).toBeDisabled();
};

export const dateTimeDialogPlay: PickerStoryPlay = async ({ canvas, canvasElement }) => {
  const body = await openPickerDialog({
    buttonName: /Open date and time picker/i,
    canvas,
    canvasElement,
  });
  await expect(body.getByRole("button", { name: "Apply" })).toBeVisible();
};

export const thaiPlay: PickerStoryPlay = async ({ canvas, canvasElement }) => {
  await expect(canvas.getByLabelText("เวลาเริ่มการจอง")).toHaveValue("2026-06-18T09:00");
  const body = await openPickerDialog({
    buttonName: /Open date and time picker/i,
    canvas,
    canvasElement,
  });
  await expect(body.getByText("June 2026")).toBeVisible();
};

export const desktop1440Play: PickerStoryPlay = async ({ canvas, canvasElement }) => {
  const body = await openPickerDialog({
    buttonName: /Open date picker/i,
    canvas,
    canvasElement,
  });
  await expect(body.getByText("June 2026")).toBeVisible();
};

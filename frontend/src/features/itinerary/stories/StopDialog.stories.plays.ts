import { expect } from "storybook/test";
import type { StopDialog } from "@/src/features/itinerary/components";
import type { StoryPlay } from "./support/story-play-types";

type StopDialogPlay = StoryPlay<typeof StopDialog>;

export const createPlay: StopDialogPlay = async ({ canvas }) => {
  await expect(canvas.getByRole("dialog", { name: /Add activity/i })).toHaveClass("stop-dialog");
  await expect(canvas.getByRole("textbox", { name: /^Activity$/i })).toBeVisible();
};

export const editPlay: StopDialogPlay = async ({ canvas }) => {
  await expect(canvas.getByRole("dialog", { name: /Edit details/i })).toBeVisible();
  await expect(canvas.getByRole("button", { name: /Delete stop/i })).toBeVisible();
};

export const ambiguousPlacePlay: StopDialogPlay = async ({ canvas }) => {
  await expect(canvas.getByText(/Central Market Kuala Lumpur/i)).toBeVisible();
  await expect(canvas.getByText(/Central Market Annexe/i)).toBeVisible();
};

export const transportationFormPlay: StopDialogPlay = async ({ canvas }) => {
  await expect(canvas.getByRole("dialog", { name: /Edit details/i })).toBeVisible();
  await expect(canvas.getByLabelText("Type")).toHaveValue("transportation");
  await expect(canvas.getByLabelText("From")).toHaveValue("Don Mueang International Airport");
  await expect(canvas.getByLabelText("To")).toHaveValue("Hong Kong International Airport");
  await expect(canvas.getByLabelText("Ticket / pass")).toHaveValue("FD ticket");
  await expect(canvas.queryByLabelText("Transportation")).not.toBeInTheDocument();
};

export const activityFormPlay: StopDialogPlay = async ({ canvas }) => {
  await expect(canvas.getByLabelText("Type")).toHaveValue("experience");
  await expect(canvas.getByLabelText("Provider")).toHaveValue("Central Market");
  await expect(canvas.getByLabelText("Meeting point")).toHaveValue("South entrance");
  await expect(canvas.getByLabelText("Booking ref")).toHaveValue("Lunch shortlist");
  await expect(canvas.queryByLabelText("Transportation")).not.toBeInTheDocument();
};

export const foodFormPlay: StopDialogPlay = async ({ canvas }) => {
  await expect(canvas.getByLabelText("Type")).toHaveValue("experience");
  await expect(canvas.getByLabelText("Provider")).toHaveValue("Central Market");
  await expect(canvas.getByLabelText("Booking ref")).toHaveValue("Lunch shortlist");
};

export const stayFormPlay: StopDialogPlay = async ({ canvas }) => {
  await expect(canvas.getByLabelText("Type")).toHaveValue("stay");
  await expect(canvas.getByLabelText("Check-in / out")).toHaveValue("15:00 check-in / 11:00 check-out");
  await expect(canvas.getByLabelText("Booking ref")).toHaveValue("WK-2409");
  await expect(canvas.getByLabelText("Bag / luggage detail")).toHaveValue("Leave bags before the food walk");
};

export const shoppingFormPlay: StopDialogPlay = async ({ canvas }) => {
  await expect(canvas.getByLabelText("Type")).toHaveValue("experience");
  await expect(canvas.getByLabelText("Provider")).toHaveValue("");
  await expect(canvas.getByLabelText("Booking ref")).toHaveValue("");
};

export const noteTaskFormPlay: StopDialogPlay = async ({ canvas }) => {
  await expect(canvas.getByLabelText("Type")).toHaveValue("task");
  await expect(canvas.getByLabelText("Detail")).toHaveValue("Check passenger names before ticket issue");
  await expect(canvas.getByLabelText("Related place")).toHaveValue("Shared booking sheet");
  await expect(canvas.getByText("More details")).toBeVisible();
};

export const thaiPlay: StopDialogPlay = async ({ canvas }) => {
  await expect(canvas.getByRole("dialog", { name: /แก้ไขรายละเอียด/i })).toBeVisible();
};

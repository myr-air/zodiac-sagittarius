import type { StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import type { PeoplePanel } from "../PeoplePanel";

type PeoplePanelPlay = NonNullable<StoryObj<typeof PeoplePanel>["play"]>;

export const managerPlay: PeoplePanelPlay = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  await expect(canvas.getByRole("region", { name: /People and presence/i })).toHaveClass("people-module", "grid");
  await expect(canvas.getByLabelText(/Status for Explorer Friend/i)).toHaveClass("member-status-stack", "flex");
};

export const readOnlyPlay: PeoplePanelPlay = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  await expect(canvas.getByText(/ออฟไลน์ 1 ชม./i)).toHaveClass("presence-pill", "inline-flex");
};

export const emptyPlay: PeoplePanelPlay = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  await expect(canvas.getByText("ไม่มีสมาชิกในตัวกรองนี้").closest(".members-empty-state")).toHaveClass("grid");
  await userEvent.click(canvas.getByRole("button", { name: /ล้างตัวกรอง/i }));
};

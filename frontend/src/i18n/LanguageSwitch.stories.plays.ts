import type { StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import type { LanguageSwitch } from "./LanguageSwitch";

type LanguageSwitchPlay = NonNullable<StoryObj<typeof LanguageSwitch>["play"]>;

export const defaultPlay: LanguageSwitchPlay = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  await expect(canvas.getByRole("button", { name: "Language and currency" })).toHaveTextContent("EN / HKD");
};

export const thaiSelectedPlay: LanguageSwitchPlay = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  await userEvent.click(canvas.getByRole("button", { name: "Language and currency" }));
  await userEvent.click(canvas.getByRole("menuitemradio", { name: "ภาษาไทย" }));
  await expect(canvas.getByRole("button", { name: "ภาษาและสกุลเงิน" })).toHaveTextContent("TH / HKD");
};

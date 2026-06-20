import type { StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import type { Button } from "@/src/ui";

type ButtonPlay = NonNullable<StoryObj<typeof Button>["play"]>;

function hexTokenToRgb(tokenName: string) {
  const token = getComputedStyle(document.documentElement).getPropertyValue(tokenName).trim();
  const expected = token.match(/^#([0-9a-f]{6})$/i);
  if (expected === null) {
    throw new Error(`${tokenName} is not a valid hex color token`);
  }

  return {
    red: Number.parseInt(expected[1].slice(0, 2), 16),
    green: Number.parseInt(expected[1].slice(2, 4), 16),
    blue: Number.parseInt(expected[1].slice(4, 6), 16),
  };
}

export const cssCheckPlay: ButtonPlay = async ({ canvas }) => {
  const button = canvas.getByRole("button", { name: /submit/i });
  const { red, green, blue } = hexTokenToRgb("--color-primary");
  await expect(getComputedStyle(button).backgroundColor).toBe(`rgb(${red}, ${green}, ${blue})`);
};

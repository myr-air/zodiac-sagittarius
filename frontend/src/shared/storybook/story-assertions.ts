import { expect } from "storybook/test";

export async function expectStoryElementPresent(
  canvasElement: HTMLElement,
  selector: string,
) {
  await expect(canvasElement.querySelector(selector)).toBeInTheDocument();
}

export async function expectStoryElementClasses(
  canvasElement: HTMLElement,
  selector: string,
  ...classNames: string[]
) {
  await expect(canvasElement.querySelector(selector)).toHaveClass(...classNames);
}

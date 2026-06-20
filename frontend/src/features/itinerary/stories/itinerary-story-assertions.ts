import { expect } from "storybook/test";

export async function expectItineraryResponsiveContract(
  canvasElement: HTMLElement,
) {
  await expect(canvasElement.querySelector(".table-scroll")).toHaveClass(
    "table-scroll",
    "overflow-x-auto",
    "max-w-full",
  );
  await expect(canvasElement.querySelector(".smart-table")).toHaveClass(
    "smart-table",
    "min-w-[520px]",
  );
  await expect(
    canvasElement.querySelector(".item-placeholder-cell"),
  ).toBeInTheDocument();
}

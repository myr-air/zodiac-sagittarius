import { expect, within } from "storybook/test";

type StoryCanvas = ReturnType<typeof within>;

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

export async function expectDayActivityPathGraph(
  canvas: StoryCanvas,
  dayName: RegExp = /Activity path graph for Day 2/i,
) {
  await expect(canvas.getByRole("group", { name: dayName })).toHaveClass(
    "activity-path-graph",
  );
}

export async function expectSelectedPathGraphNode(
  canvas: StoryCanvas,
  name: string | RegExp,
) {
  await expect(canvas.getByRole("button", { name })).toHaveClass(
    "activity-path-graph-node--selected",
  );
}

export async function expectPathGraphNode(
  canvas: StoryCanvas,
  name: string | RegExp,
) {
  await expect(canvas.getByRole("button", { name })).toBeInTheDocument();
}

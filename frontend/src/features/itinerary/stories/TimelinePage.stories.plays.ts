import { expect } from "storybook/test";
import type { TimelineView } from "@/src/features/itinerary/components";
import { expectStoryElementClasses } from "@/src/shared/storybook/story-assertions";
import { expectTimelineStructure } from "./TimelinePage.stories.support";
import type { StoryPlay } from "./support/story-play-types";

type TimelinePagePlay = StoryPlay<typeof TimelineView>;

export const ownerThaiPlay: TimelinePagePlay = async ({ canvas }) => {
  await expect(canvas.getByRole("region", { name: /ไทม์ไลน์ทริป/i })).toHaveClass("timeline-panel");
  await expect(canvas.getByText("ไทม์ไลน์")).toBeVisible();
  await expect(canvas.getByRole("button", { name: /เลือกจุดในไทม์ไลน์ Dim Dim Sum/i })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
};

export const travelerPlay: TimelinePagePlay = async ({ canvas }) => {
  await expect(canvas.getByRole("region", { name: /Trip timeline/i })).toHaveClass("timeline-panel");
  await expect(canvas.getByRole("button", { name: /Select timeline stop Dim Dim Sum/i })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
};

export const densePlay: TimelinePagePlay = async ({ canvasElement }) => {
  await expectTimelineStructure(canvasElement);
  await expect(canvasElement.querySelectorAll(".timeline-day").length).toBeGreaterThan(3);
};

export const emptyPlay: TimelinePagePlay = async ({ canvasElement }) => {
  await expectTimelineStructure(canvasElement);
  await expect(canvasElement.querySelectorAll(".timeline-stop").length).toBe(0);
};

export const planABAlternativesPlay: TimelinePagePlay = async ({ canvas }) => {
  await expect(canvas.getByRole("region", { name: /Trip timeline/i })).toHaveClass("timeline-panel");
  await expect(canvas.getByRole("button", { name: /Select timeline stop Harbour breakfast/i })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(
    canvas.getByRole("button", { name: /Select timeline stop Plan A gallery route/i }),
  ).toBeInTheDocument();
  await expect(
    canvas.getByRole("button", { name: /Select timeline stop Plan B harbour route/i }),
  ).toBeInTheDocument();
};

export const advisoryWarningPlay: TimelinePagePlay = async ({ canvas }) => {
  await expect(canvas.getByRole("region", { name: /Trip timeline/i })).toHaveClass("timeline-panel");
  await expect(canvas.getByRole("button", { name: /Select timeline stop Peak tram timed entry/i })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(canvas.getByText("Book timed ticket")).toHaveClass("timeline-warning");
};

export const tabletPlay: TimelinePagePlay = async ({ canvasElement }) => {
  await expectTimelineStructure(canvasElement);
  await expectStoryElementClasses(canvasElement, ".timeline-grid", "max-[1199px]:grid-cols-1");
};

export const responsivePlay: TimelinePagePlay = async ({ canvasElement }) => {
  await expectTimelineStructure(canvasElement);
};

export const mobilePlay: TimelinePagePlay = async ({ canvasElement }) => {
  await expectTimelineStructure(canvasElement);
  await expectStoryElementClasses(
    canvasElement,
    ".timeline-grid",
    "max-[1199px]:grid-cols-1",
    "max-[767px]:overflow-y-auto",
  );
  await expectStoryElementClasses(
    canvasElement,
    ".timeline-stop-button",
    "max-[767px]:grid-cols-[62px_32px_minmax(0,1fr)]",
  );
};

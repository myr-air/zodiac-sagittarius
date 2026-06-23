import { expect, userEvent } from "storybook/test";
import type { ContextRail } from "@/src/features/itinerary/components";
import type { StoryPlay } from "./support/story-play-types";

type ContextRailPlay = StoryPlay<typeof ContextRail>;

export const notesOpenPlay: ContextRailPlay = async ({ canvas }) => {
  await expect(canvas.getByRole("complementary", { name: /Planning context/i })).toHaveClass("context-rail--open");
  await expect(canvas.getByRole("tab", { name: /Notes/i })).toHaveAttribute("aria-selected", "true");
  await expect(canvas.getByRole("region", { name: /Stop notes/i })).toHaveClass("stop-notes-module");
  await expect(canvas.getByLabelText(/Add a note for this stop/i)).toBeEnabled();
};

export const bookingTabPlay: ContextRailPlay = async ({ canvas }) => {
  await userEvent.click(canvas.getByRole("tab", { name: /Booking/i }));
  await expect(canvas.getByRole("region", { name: /Booking and prep for this stop/i })).toHaveClass(
    "stop-booking-module",
  );
  await expect(canvas.getByText("Dim Dim Sum reservation")).toBeInTheDocument();
  await expect(canvas.getByRole("checkbox", { name: /Dim Dim Sum/i })).toBeInTheDocument();
};

export const suggestionsTabPlay: ContextRailPlay = async ({ canvas }) => {
  await userEvent.click(canvas.getByRole("tab", { name: /Suggestions/i }));
  await expect(canvas.getByRole("region", { name: /Suggestion review/i })).toHaveClass("suggestion-module");
  await expect(canvas.getAllByRole("button", { name: /Approve/i }).length).toBeGreaterThan(0);
};

export const tripExpensesOnlyPlay: ContextRailPlay = async ({ canvas }) => {
  await expect(canvas.getByRole("complementary", { name: /Planning context/i })).toHaveClass("context-rail");
  await expect(canvas.queryByRole("tablist", { name: /Stop detail tabs/i })).toBeNull();
  await expect(canvas.getByRole("region", { name: /Expense summary/i })).toHaveClass("expense-module");
  await expect(canvas.getByText(/Cost per person/i)).toBeInTheDocument();
};

export const readOnlyTravelerPlay: ContextRailPlay = async ({ canvas }) => {
  await expect(canvas.getByRole("button", { name: /Suggest edit/i })).toBeEnabled();
  await expect(canvas.getByRole("button", { name: /Save note/i })).toBeDisabled();
  await userEvent.click(canvas.getByRole("tab", { name: /Booking/i }));
  await expect(canvas.getByText(/No booking warnings for this stop/i)).toBeInTheDocument();
  await expect(canvas.getByText(/No checklist items linked to this stop/i)).toBeInTheDocument();
};

export const closedPlay: ContextRailPlay = async ({ canvasElement }) => {
  const rail = canvasElement.querySelector(".context-rail");
  await expect(rail).toHaveAttribute("aria-hidden", "true");
  await expect(rail).toHaveClass("context-rail--closed");
};

export const mobilePlay: ContextRailPlay = async ({ canvas }) => {
  await expect(canvas.getByRole("complementary", { name: /Planning context/i })).toHaveClass("context-rail--open");
  await expect(canvas.getByRole("tablist", { name: /Stop detail tabs/i })).toHaveClass("inspector-tabs");
};

export const tabletPlay: ContextRailPlay = async ({ canvas }) => {
  await expect(canvas.getByRole("complementary", { name: /Planning context/i })).toHaveClass("context-rail--open");
  await expect(canvas.getByRole("tablist", { name: /Stop detail tabs/i })).toHaveClass("inspector-tabs");
  await expect(canvas.getByRole("region", { name: /Selected stop detail/i })).toBeInTheDocument();
};

export const thaiPlay: ContextRailPlay = async ({ canvas }) => {
  await expect(canvas.getByRole("complementary", { name: /ข้อมูลประกอบการวางแผน/i })).toHaveClass(
    "context-rail--open",
  );
  await expect(canvas.getByRole("tab", { name: "โน้ต" })).toHaveAttribute("aria-selected", "true");
  await expect(canvas.getByRole("tab", { name: "การจอง" })).toBeInTheDocument();
  await expect(canvas.getByRole("tab", { name: "ข้อเสนอ" })).toBeInTheDocument();
};

export const desktop1440Play: ContextRailPlay = async ({ canvas }) => {
  await expect(canvas.getByRole("complementary", { name: /Planning context/i })).toHaveClass("context-rail--open");
  await expect(canvas.getByRole("region", { name: /Selected stop detail/i })).toBeInTheDocument();
};

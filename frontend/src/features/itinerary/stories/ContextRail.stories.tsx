import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent } from "storybook/test";
import { ContextRail } from "@/src/features/itinerary/components";
import {
  contextRailBaseArgs,
  contextRailBookingDocs,
  readOnlyTravelerContextRailArgs,
} from "./ContextRail.stories.support";

const meta = {
  title: "Design System/Context Rail",
  component: ContextRail,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="relative min-h-[760px] overflow-hidden bg-(--color-page)">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ContextRail>;

export default meta;

type Story = StoryObj<typeof meta>;

export const NotesOpen: Story = {
  args: contextRailBaseArgs,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("complementary", { name: /Planning context/i })).toHaveClass("context-rail--open");
    await expect(canvas.getByRole("tab", { name: /Notes/i })).toHaveAttribute("aria-selected", "true");
    await expect(canvas.getByRole("region", { name: /Stop notes/i })).toHaveClass("stop-notes-module");
    await expect(canvas.getByLabelText(/Add a note for this stop/i)).toBeEnabled();
  },
};

export const BookingTab: Story = {
  args: {
    ...contextRailBaseArgs,
    bookingDocs: contextRailBookingDocs,
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("tab", { name: /Booking/i }));
    await expect(canvas.getByRole("region", { name: /Booking and prep for this stop/i })).toHaveClass("stop-booking-module");
    await expect(canvas.getByText("Dim Dim Sum reservation")).toBeInTheDocument();
    await expect(canvas.getByRole("checkbox", { name: /Dim Dim Sum/i })).toBeInTheDocument();
  },
};

export const SuggestionsTab: Story = {
  args: contextRailBaseArgs,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("tab", { name: /Suggestions/i }));
    await expect(canvas.getByRole("region", { name: /Suggestion review/i })).toHaveClass("suggestion-module");
    await expect(canvas.getAllByRole("button", { name: /Approve/i }).length).toBeGreaterThan(0);
  },
};

export const TripExpensesOnly: Story = {
  args: {
    ...contextRailBaseArgs,
    selectedItem: undefined,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("complementary", { name: /Planning context/i })).toHaveClass("context-rail");
    await expect(canvas.queryByRole("tablist", { name: /Stop detail tabs/i })).toBeNull();
    await expect(canvas.getByRole("region", { name: /Expense summary/i })).toHaveClass("expense-module");
    await expect(canvas.getByText(/Cost per person/i)).toBeInTheDocument();
  },
};

export const ReadOnlyTraveler: Story = {
  args: readOnlyTravelerContextRailArgs,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: /Suggest edit/i })).toBeEnabled();
    await expect(canvas.getByRole("button", { name: /Save note/i })).toBeDisabled();
    await userEvent.click(canvas.getByRole("tab", { name: /Booking/i }));
    await expect(canvas.getByText(/No booking warnings for this stop/i)).toBeInTheDocument();
    await expect(canvas.getByText(/No checklist items linked to this stop/i)).toBeInTheDocument();
  },
};

export const Closed: Story = {
  args: {
    ...contextRailBaseArgs,
    open: false,
  },
  play: async ({ canvasElement }) => {
    const rail = canvasElement.querySelector(".context-rail");
    await expect(rail).toHaveAttribute("aria-hidden", "true");
    await expect(rail).toHaveClass("context-rail--closed");
  },
};

export const Mobile: Story = {
  args: contextRailBaseArgs,
  parameters: { viewport: { defaultViewport: "mobile320" } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("complementary", { name: /Planning context/i })).toHaveClass("context-rail--open");
    await expect(canvas.getByRole("tablist", { name: /Stop detail tabs/i })).toHaveClass("inspector-tabs");
  },
};

export const Tablet: Story = {
  args: contextRailBaseArgs,
  parameters: { viewport: { defaultViewport: "tablet768" } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("complementary", { name: /Planning context/i })).toHaveClass("context-rail--open");
    await expect(canvas.getByRole("tablist", { name: /Stop detail tabs/i })).toHaveClass("inspector-tabs");
    await expect(canvas.getByRole("region", { name: /Selected stop detail/i })).toBeInTheDocument();
  },
};

export const Thai: Story = {
  args: contextRailBaseArgs,
  parameters: { locale: "th" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("complementary", { name: /ข้อมูลประกอบการวางแผน/i })).toHaveClass("context-rail--open");
    await expect(canvas.getByRole("tab", { name: "โน้ต" })).toHaveAttribute("aria-selected", "true");
    await expect(canvas.getByRole("tab", { name: "การจอง" })).toBeInTheDocument();
    await expect(canvas.getByRole("tab", { name: "ข้อเสนอ" })).toBeInTheDocument();
  },
};

export const Desktop1024: Story = {
  args: contextRailBaseArgs,
  parameters: { viewport: { defaultViewport: "desktop1024" } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("complementary", { name: /Planning context/i })).toHaveClass("context-rail--open");
    await expect(canvas.getByRole("tablist", { name: /Stop detail tabs/i })).toHaveClass("inspector-tabs");
  },
};

export const Desktop1440: Story = {
  args: contextRailBaseArgs,
  parameters: { viewport: { defaultViewport: "desktop1440" } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("complementary", { name: /Planning context/i })).toHaveClass("context-rail--open");
    await expect(canvas.getByRole("region", { name: /Selected stop detail/i })).toBeInTheDocument();
  },
};

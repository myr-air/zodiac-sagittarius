import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { asyncNoop } from "@/src/testing/storybook-actions";
import { seedTrip } from "@/src/trip/seed";
import { tripFixture } from "@/src/trip/trip-fixtures";
import { TripSettingsPage } from "./TripSettingsPage";

const meta = {
  title: "Pages/Trip Settings",
  component: TripSettingsPage,
  parameters: { layout: "fullscreen" },
  tags: ["ai-generated"],
} satisfies Meta<typeof TripSettingsPage>;

export default meta;

type Story = StoryObj<typeof meta>;
const planImpactTrip = {
  ...seedTrip,
  endDate: seedTrip.startDate,
};

async function expectSettingsResponsiveContract(canvasElement: HTMLElement) {
  await expect(canvasElement.querySelector(".content-grid")).toHaveClass("content-grid", "max-[920px]:grid-cols-1");
  await expect(canvasElement.querySelector(".field-grid")).toHaveClass("field-grid", "max-[767px]:grid-cols-1");
}

export const Owner: Story = {
  args: {
    canEdit: true,
    currentMember: tripFixture.currentMembers.owner,
    trip: seedTrip,
    onSave: asyncNoop,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("region", { name: /Trip settings/i })).toHaveClass("trip-settings-page");
    await expect(canvas.getByRole("form", { name: /Trip details/i })).toBeVisible();
    await expect(canvas.getByRole("button", { name: /Save changes/i })).toBeEnabled();
  },
};

export const Viewer: Story = {
  args: {
    ...Owner.args,
    canEdit: false,
    currentMember: tripFixture.currentMembers.viewer,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Only owners and organizers can edit trip settings/i)).toBeVisible();
    await expect(canvas.getByRole("button", { name: /Save changes/i })).toBeDisabled();
  },
};

export const Traveler: Story = {
  args: {
    ...Owner.args,
    canEdit: false,
    currentMember: tripFixture.currentMembers.traveler,
  },
  play: Viewer.play,
};

export const Thai: Story = {
  args: Owner.args,
  parameters: { locale: "th" },
  play: async ({ canvas, canvasElement }) => {
    await expectSettingsResponsiveContract(canvasElement);
    await expect(canvas.getByRole("region", { name: /ตั้งค่าทริป/i })).toBeVisible();
    await expect(canvas.getByLabelText(/ชื่อทริป/i)).toBeVisible();
    await expect(canvas.getByRole("button", { name: /บันทึกการเปลี่ยนแปลง/i })).toBeEnabled();
  },
};

export const PlanImpactWarning: Story = {
  args: {
    ...Owner.args,
    trip: planImpactTrip,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("region", { name: /Trip settings/i })).toHaveClass("trip-settings-page");
    await expect(canvas.getByRole("region", { name: /Plan impact/i })).toBeVisible();
    await expect(canvas.getByText(/planned stops will sit outside the new trip dates/i)).toBeVisible();
  },
};

export const Mobile: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "mobile320" } },
  play: async ({ canvasElement }) => {
    await expectSettingsResponsiveContract(canvasElement);
  },
};

export const Tablet: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "tablet768" } },
  play: async ({ canvasElement }) => {
    await expectSettingsResponsiveContract(canvasElement);
  },
};

export const Desktop1024: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "desktop1024" } },
  play: async ({ canvasElement }) => {
    await expectSettingsResponsiveContract(canvasElement);
  },
};

export const Desktop1440: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "desktop1440" } },
  play: async ({ canvasElement }) => {
    await expectSettingsResponsiveContract(canvasElement);
  },
};

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { appRoutes } from "@/src/trip/workspace/sagittarius-app/support";
import { PanelHeading, PortalEmptyState, PortalListSkeleton, PortalStatSkeleton, SettingLine, Stat } from "./account-portal-primitives";

const meta = {
  title: "Pages/Account Portal Primitives",
  parameters: { layout: "padded" },
  tags: ["ai-generated"],
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  render: () => (
    <section className="grid max-w-[720px] gap-4">
      <PanelHeading icon="home" title="Portal dashboard" detail="Fast access to trips, invites, and account settings." />
      <div className="grid grid-cols-2 gap-2.5">
        <Stat label="Trips" value={8} />
        <Stat label="Owned" value={3} />
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <PortalStatSkeleton />
      </div>
      <PortalListSkeleton rows={2} />
      <SettingLine label="Trusted devices" value="2" />
      <PortalEmptyState
        actionHref={appRoutes.portalNewTrip()}
        actionLabel="Create trip"
        detail="Start a workspace before inviting travelers."
        icon="plus"
        title="No trips yet"
      />
    </section>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Portal dashboard").closest(".account-panel-heading")).toHaveClass("flex");
    await expect(canvas.getByText("Trips").closest(".account-stat")).toHaveClass("grid");
    await expect(canvasElement.querySelector(".portal-skeleton-card")).toHaveClass("account-stat");
    await expect(canvasElement.querySelector(".portal-list-skeleton")).toHaveClass("grid");
    await expect(canvas.getByText("Trusted devices").closest(".account-setting-line")).toHaveClass("grid");
    await expect(canvas.getByText("No trips yet").closest(".portal-empty-state")).toHaveClass("grid");
  },
};

export const ThaiEmpty: Story = {
  parameters: { locale: "th" },
  render: () => (
    <PortalEmptyState
      actionHref={appRoutes.portalNewTrip()}
      actionLabel="สร้างทริป"
      detail="เริ่มสร้างพื้นที่วางแผนก่อนชวนเพื่อนร่วมทริป"
      icon="plus"
      title="ยังไม่มีทริป"
    />
  ),
};

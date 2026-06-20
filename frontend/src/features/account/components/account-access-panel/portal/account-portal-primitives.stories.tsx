import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { appRoutes } from "@/src/trip/workspace/sagittarius-app/support";
import { AccountPortalNav } from "./account-portal-nav";
import { PanelHeading, PortalEmptyState, PortalListSkeleton, PortalStatSkeleton, SettingLine, Stat } from "./account-portal-primitives";
import { overviewPlay } from "./account-portal-primitives.stories.plays";

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
      <AccountPortalNav activeSection="dashboard" email="aom@example.test" />
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
  play: overviewPlay,
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

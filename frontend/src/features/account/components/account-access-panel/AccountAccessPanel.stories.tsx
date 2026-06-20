import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { seedTrip } from "@/src/trip/seed";
import { AccountAccessPanel } from "./AccountAccessPanel";
import {
  accountLoginPlay,
  accountLoginThaiPlay,
  accountRegisterPlay,
  newTripBuilderPlay,
  newTripMobilePlay,
  portalDashboardPlay,
  tripAccessPlay,
} from "./AccountAccessPanel.stories.plays";
import {
  accountLoginStoryArgs,
  portalDashboardStoryArgs,
} from "./account-access-panel.stories.support";

const meta = {
  title: "Pages/Account Access",
  component: AccountAccessPanel,
  parameters: { layout: "fullscreen" },
  tags: ["ai-generated"],
} satisfies Meta<typeof AccountAccessPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const AccountLogin: Story = {
  args: accountLoginStoryArgs,
  play: accountLoginPlay,
};

export const AccountRegister: Story = {
  args: {
    ...AccountLogin.args,
    accessMode: "account-register",
  },
  play: accountRegisterPlay,
};

export const AccountLoginThai: Story = {
  args: AccountLogin.args,
  parameters: { locale: "th" },
  play: accountLoginThaiPlay,
};

export const TripAccess: Story = {
  args: {
    ...AccountLogin.args,
    accessMode: "trip-access",
    initialJoinCode: seedTrip.joinId,
  },
  play: tripAccessPlay,
};

export const PortalDashboard: Story = {
  args: portalDashboardStoryArgs,
  play: portalDashboardPlay,
};

export const NewTripBuilder: Story = {
  args: {
    ...PortalDashboard.args,
    portalSection: "new-trip",
  },
  play: newTripBuilderPlay,
};

export const NewTripMobile: Story = {
  args: NewTripBuilder.args,
  parameters: { viewport: { defaultViewport: "mobile320" } },
  play: newTripMobilePlay,
};

export const AccountLoginTablet: Story = {
  args: AccountLogin.args,
  parameters: { viewport: { defaultViewport: "tablet768" } },
  play: AccountLogin.play,
};

export const AccountLoginDesktop1024: Story = {
  args: AccountLogin.args,
  parameters: { viewport: { defaultViewport: "desktop1024" } },
  play: AccountLogin.play,
};

export const AccountLoginDesktop1440: Story = {
  args: AccountLogin.args,
  parameters: { viewport: { defaultViewport: "desktop1440" } },
  play: AccountLogin.play,
};

export const TripAccessTablet: Story = {
  args: TripAccess.args,
  parameters: { viewport: { defaultViewport: "tablet768" } },
  play: TripAccess.play,
};

export const TripAccessDesktop1024: Story = {
  args: TripAccess.args,
  parameters: { viewport: { defaultViewport: "desktop1024" } },
  play: TripAccess.play,
};

export const TripAccessDesktop1440: Story = {
  args: TripAccess.args,
  parameters: { viewport: { defaultViewport: "desktop1440" } },
  play: TripAccess.play,
};

export const NewTripTablet: Story = {
  args: NewTripBuilder.args,
  parameters: { viewport: { defaultViewport: "tablet768" } },
  play: NewTripBuilder.play,
};

export const NewTripDesktop1024: Story = {
  args: NewTripBuilder.args,
  parameters: { viewport: { defaultViewport: "desktop1024" } },
  play: NewTripBuilder.play,
};

export const NewTripDesktop1440: Story = {
  args: NewTripBuilder.args,
  parameters: { viewport: { defaultViewport: "desktop1440" } },
  play: NewTripBuilder.play,
};

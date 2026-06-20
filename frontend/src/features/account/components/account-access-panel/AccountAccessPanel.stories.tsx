import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  argsStory,
  viewportStory,
} from "@/src/shared/storybook/story-builders";
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
} from "./storybook/AccountAccessPanel.stories.plays";
import {
  accountLoginStoryArgs,
  portalDashboardStoryArgs,
} from "./storybook/account-access-panel.stories.support";

const meta = {
  title: "Pages/Account Access",
  component: AccountAccessPanel,
  parameters: { layout: "fullscreen" },
  tags: ["ai-generated"],
} satisfies Meta<typeof AccountAccessPanel>;

export default meta;

type Story = StoryObj<typeof meta>;
const accountStory = argsStory<Story>;
const viewportStoryForAccount = viewportStory<Story>;

export const AccountLogin: Story = {
  args: accountLoginStoryArgs,
  play: accountLoginPlay,
};

export const AccountRegister: Story = accountStory(
  AccountLogin.args ?? {},
  {
    accessMode: "account-register",
  },
  accountRegisterPlay,
);

export const AccountLoginThai: Story = accountStory(
  AccountLogin.args ?? {},
  {},
  accountLoginThaiPlay,
  { locale: "th" },
);

export const TripAccess: Story = accountStory(
  AccountLogin.args ?? {},
  {
    accessMode: "trip-access",
    initialJoinCode: seedTrip.joinId,
  },
  tripAccessPlay,
);

export const PortalDashboard: Story = {
  args: portalDashboardStoryArgs,
  play: portalDashboardPlay,
};

export const NewTripBuilder: Story = accountStory(
  PortalDashboard.args ?? {},
  {
    portalSection: "new-trip",
  },
  newTripBuilderPlay,
);

const accountLoginArgs = AccountLogin.args ?? {};
const tripAccessArgs = TripAccess.args ?? {};
const newTripBuilderArgs = NewTripBuilder.args ?? {};

export const NewTripMobile: Story = viewportStoryForAccount(
  newTripBuilderArgs,
  "mobile320",
  newTripMobilePlay,
);

export const AccountLoginTablet: Story = viewportStoryForAccount(
  accountLoginArgs,
  "tablet768",
  AccountLogin.play,
);

export const AccountLoginDesktop1024: Story = viewportStoryForAccount(
  accountLoginArgs,
  "desktop1024",
  AccountLogin.play,
);

export const AccountLoginDesktop1440: Story = viewportStoryForAccount(
  accountLoginArgs,
  "desktop1440",
  AccountLogin.play,
);

export const TripAccessTablet: Story = viewportStoryForAccount(
  tripAccessArgs,
  "tablet768",
  TripAccess.play,
);

export const TripAccessDesktop1024: Story = viewportStoryForAccount(
  tripAccessArgs,
  "desktop1024",
  TripAccess.play,
);

export const TripAccessDesktop1440: Story = viewportStoryForAccount(
  tripAccessArgs,
  "desktop1440",
  TripAccess.play,
);

export const NewTripTablet: Story = viewportStoryForAccount(
  newTripBuilderArgs,
  "tablet768",
  NewTripBuilder.play,
);

export const NewTripDesktop1024: Story = viewportStoryForAccount(
  newTripBuilderArgs,
  "desktop1024",
  NewTripBuilder.play,
);

export const NewTripDesktop1440: Story = viewportStoryForAccount(
  newTripBuilderArgs,
  "desktop1440",
  NewTripBuilder.play,
);

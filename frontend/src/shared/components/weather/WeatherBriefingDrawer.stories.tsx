import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { viewportStory } from "@/src/shared/storybook/story-builders";
import { weatherBriefings } from "./WeatherBriefing.fixtures";
import { WeatherBriefingDrawer } from "./WeatherBriefingDrawer";
import { partialDataPlay } from "./WeatherBriefingDrawer.stories.plays";

const meta = {
  title: "Design System/Weather Briefing Drawer",
  component: WeatherBriefingDrawer,
  parameters: { layout: "fullscreen" },
  tags: ["ai-generated"],
} satisfies Meta<typeof WeatherBriefingDrawer>;

export default meta;

type Story = StoryObj<typeof meta>;
const drawerViewportStory = viewportStory<Story>;

const drawerBriefing = {
  ...weatherBriefings[1],
  holiday: { title: "Public holiday", body: "No public holiday found.", meta: { source: "Nager.Date", sourceUrl: null, fetchedAt: "2026-06-04T00:00:00Z", expiresAt: "2027-01-01T00:00:00Z", confidence: "high" as const, unavailableReason: null } },
  festival: { title: "Festival", body: "Waterfront light show runs in the evening. Confidence medium.", meta: { source: "Curated research", sourceUrl: null, fetchedAt: "2026-06-04T00:00:00Z", expiresAt: "2026-07-01T00:00:00Z", confidence: "medium" as const, unavailableReason: null } },
  facts: { title: "Daily facts", body: "Currency HKD. Emergency number 999. Sunset around 19:10.", meta: { source: "REST Countries", sourceUrl: null, fetchedAt: "2026-06-04T00:00:00Z", expiresAt: "2027-01-01T00:00:00Z", confidence: "high" as const, unavailableReason: null } },
  outfitAdvice: { title: "Outfit advice", body: "Light breathable shirt, compact umbrella, and shoes that can handle wet pavement.", meta: { source: "Sagittarius", sourceUrl: null, fetchedAt: "2026-06-04T00:00:00Z", expiresAt: "2026-06-04T06:00:00Z", confidence: "medium" as const, unavailableReason: null } },
};

const partialBriefing = {
  ...weatherBriefings[5],
  holiday: null,
  festival: { title: "Festival", body: "Festival data is still being checked for this date.", meta: { source: "Curated research", sourceUrl: null, fetchedAt: null, expiresAt: null, confidence: "unknown" as const, unavailableReason: "Pending source review" } },
  facts: null,
  outfitAdvice: null,
};

export const OrganizerDrawer: Story = {
  args: {
    briefing: drawerBriefing,
    locale: "en",
    canEdit: true,
    isOpen: true,
    onClose: () => {},
    onSaveOverrides: () => {},
  },
};

export const TravelerDrawer: Story = {
  args: {
    briefing: drawerBriefing,
    locale: "en",
    canEdit: false,
    isOpen: true,
    onClose: () => {},
  },
};

export const MobileSheet: Story = drawerViewportStory(
  {
    briefing: drawerBriefing,
    locale: "en",
    canEdit: true,
    isOpen: true,
    onClose: () => {},
    onSaveOverrides: () => {},
  },
  "mobile320",
  undefined,
);

export const PartialData: Story = {
  args: {
    briefing: partialBriefing,
    locale: "en",
    canEdit: true,
    isOpen: true,
    onClose: () => {},
    onSaveOverrides: () => {},
  },
  play: partialDataPlay,
};

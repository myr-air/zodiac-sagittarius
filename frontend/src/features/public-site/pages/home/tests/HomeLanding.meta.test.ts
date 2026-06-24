import { describe, expect, it } from "vitest";
import { enHomeLandingMessages } from "@/src/i18n/messages/en.home";
import {
  buildHomePreviewChecklistItems,
  buildHomePreviewDayCards,
  buildHomePreviewMenuItems,
  buildHomeWorkflowItems,
} from "../HomeLanding.meta";

const landing = enHomeLandingMessages;
const preview = landing.preview;

describe("HomeLanding meta", () => {
  it("builds preview menu items with overview active first", () => {
    expect(buildHomePreviewMenuItems(preview)).toEqual([
      { active: true, key: "overview", label: "Overview" },
      { active: false, key: "itinerary", label: "Itinerary" },
      { active: false, key: "map", label: "Map" },
      { active: false, key: "budget", label: "Budget" },
      { active: false, key: "checklist", label: "Checklist" },
    ]);
  });

  it("builds preview day cards in artwork order", () => {
    expect(buildHomePreviewDayCards(preview).map((day) => ({
      backgroundPosition: day.backgroundPosition,
      key: day.key,
      title: day.title,
    }))).toEqual([
      { backgroundPosition: "0% 50%", key: "first", title: "Arrive Tokyo" },
      { backgroundPosition: "33.333% 50%", key: "second", title: "Classic Kamakura" },
      { backgroundPosition: "66.666% 50%", key: "third", title: "Food crawl" },
    ]);
  });

  it("builds checklist items from the shared checked set", () => {
    expect(buildHomePreviewChecklistItems(preview)).toEqual([
      { checked: true, key: "flights", label: "Book flights" },
      { checked: true, key: "hotel", label: "Reserve hotel" },
      { checked: true, key: "cash", label: "Exchange cash" },
      { checked: false, key: "packing", label: "Share packing list" },
    ]);
  });

  it("builds workflow cards with numbering and localized copy", () => {
    expect(buildHomeWorkflowItems(landing)).toEqual([
      {
        icon: "users",
        key: "invite",
        number: 1,
        text: "Start a new trip and invite your friends to join the planning workspace instantly.",
        title: "Invite & Create",
        tone: "coral",
      },
      {
        icon: "list",
        key: "plan",
        number: 2,
        text: "Add places, create checklists, and divide budget seamlessly in one view.",
        title: "Plan & Organize",
        tone: "sand",
      },
      {
        icon: "wallet",
        key: "travel",
        number: 3,
        text: "Everything is ready. Hit the road and create unforgettable memories together.",
        title: "Travel Together",
        tone: "sky",
      },
    ]);
  });
});

import type { Locale } from "@/src/i18n/types";
import type { ItineraryItem, Member, TripTask } from "@/src/trip/types";

export type OverviewRoleLens = "manager" | "traveler" | "viewer";

export function overviewRoleLens(member?: Member): OverviewRoleLens {
  if (member?.role === "owner" || member?.role === "organizer") return "manager";
  if (member?.role === "traveler") return "traveler";
  return "viewer";
}

export function stopLabel(
  itemId: string,
  items: ItineraryItem[],
  fallback: string,
): string {
  /* v8 ignore next */
  return items.find((item) => item.id === itemId)?.activity ?? fallback;
}

export function travelerNextStopDetail(item: ItineraryItem, fallback: string): string {
  /* v8 ignore next */
  return item.transportation || item.note || fallback;
}

export function viewerNextStopDetail(item: ItineraryItem, fallback: string): string {
  /* v8 ignore next */
  return item.transportation || fallback;
}

export function managerNextStopDetail(item: ItineraryItem, fallback: string): string {
  /* v8 ignore next */
  return item.transportation || fallback;
}

export function taskKindLabel(
  task: TripTask,
  labels: { booking: string; prep: string },
): string {
  if (task.kind === "booking" || task.relatedItemId || task.title.includes("จอง")) {
    return labels.booking;
  }
  return labels.prep;
}

export function isMyTask(task: TripTask, currentMemberId: string): boolean {
  return task.createdBy === currentMemberId || task.assigneeId === currentMemberId;
}

export type DestinationTone = "harbor" | "city" | "coast" | "market";

export interface DestinationVisual {
  tone: DestinationTone;
  label: string;
  imageUrl?: string;
  polaroids: Array<{ imageUrl: string; caption: string }>;
}

export function buildDestinationVisual(destinationLabel: string): DestinationVisual {
  const label = destinationLabel.trim() || "Trip destination";
  const normalized = label.toLocaleLowerCase("en-US");
  if (/(hong kong|harbour|harbor|shenzhen|bay)/i.test(normalized)) {
    return {
      tone: "harbor",
      label,
      imageUrl: "/landing/auth/photo-hong-kong-skyline.png",
      polaroids: [
        { imageUrl: "/landing/auth/photo-mong-kok-market.png", caption: "Market" },
        { imageUrl: "/landing/auth/photo-hong-kong-skyline.png", caption: "Harbour" },
        { imageUrl: "/landing/auth/photo-dim-sum-brunch.png", caption: "Dim sum" },
      ],
    };
  }
  if (/(beach|coast|island|phuket|okinawa|bali)/i.test(normalized)) {
    return {
      tone: "coast",
      label,
      imageUrl: "/landing/auth/photo-krabi.png",
      polaroids: [
        { imageUrl: "/landing/auth/photo-krabi.png", caption: "Coast" },
        { imageUrl: "/landing/auth/photo-santorini.png", caption: "Sunset" },
        { imageUrl: "/landing/auth/photo-cappadocia.png", caption: "Route" },
      ],
    };
  }
  if (/(market|bazaar|night|taipei|bangkok)/i.test(normalized)) {
    return {
      tone: "market",
      label,
      imageUrl: "/landing/auth/photo-santorini.png",
      polaroids: [
        { imageUrl: "/landing/auth/photo-mong-kok-market.png", caption: "Market" },
        { imageUrl: "/landing/auth/photo-dim-sum-brunch.png", caption: "Food" },
        { imageUrl: "/landing/auth/photo-santorini.png", caption: "Night" },
      ],
    };
  }
  return {
    tone: "city",
    label,
    imageUrl: "/landing/auth/photo-kyoto.png",
    polaroids: [
      { imageUrl: "/landing/auth/photo-kyoto.png", caption: "City" },
      { imageUrl: "/landing/auth/photo-cappadocia.png", caption: "Route" },
      { imageUrl: "/landing/auth/photo-krabi.png", caption: "Pause" },
    ],
  };
}

export function getHighlightImage(item: ItineraryItem): string | undefined {
  const activity = item.activity.toLowerCase();

  if (
    activity.includes("dim dim sum") ||
    activity.includes("ติ่มซำ") ||
    activity.includes("food") ||
    activity.includes("กิน") ||
    activity.includes("อาหาร") ||
    activity.includes("brunch") ||
    activity.includes("lunch") ||
    activity.includes("dinner")
  ) {
    return "/landing/auth/photo-dim-sum-brunch.png";
  }
  if (
    activity.includes("mong kok") ||
    activity.includes("ladies market") ||
    activity.includes("ช้อป") ||
    activity.includes("เดินเล่น") ||
    activity.includes("market") ||
    activity.includes("shopping") ||
    activity.includes("ซื้อ")
  ) {
    return "/landing/auth/photo-mong-kok-market.png";
  }
  if (
    activity.includes("peak tram") ||
    activity.includes("victoria peak") ||
    activity.includes("skyline") ||
    activity.includes("view") ||
    activity.includes("วิวมุมสูง") ||
    activity.includes("ชมวิว") ||
    activity.includes("sky terrace")
  ) {
    return "/landing/auth/photo-hong-kong-skyline.png";
  }

  if (item.activityType === "food") {
    return "/landing/auth/photo-dim-sum-brunch.png";
  }
  if (item.activityType === "shopping") {
    return "/landing/auth/photo-mong-kok-market.png";
  }
  if (item.activityType === "attraction") {
    return "/landing/auth/photo-hong-kong-skyline.png";
  }

  const images = [
    "/landing/auth/photo-kyoto.png",
    "/landing/auth/photo-krabi.png",
    "/landing/auth/photo-santorini.png",
    "/landing/auth/photo-cappadocia.png",
  ];
  const hash = item.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return images[hash % images.length];
}

export function buildHighlightItems(items: ItineraryItem[]): ItineraryItem[] {
  const preferredItems = items.filter((item) =>
    ["food", "attraction", "experience", "shopping"].includes(item.activityType)
  );
  return (preferredItems.length
    ? preferredItems
    : items.filter((item) => item.activityType !== "travel")
  ).slice(0, 4);
}

export function photoBoardEmptyMessage(message: string): string {
  if (message === "ยังไม่มีไฮไลต์ในแผนนี้") {
    return "ยังไม่มีภาพไฮไลต์ในแผนนี้";
  }
  if (message === "No highlights in this plan yet.") {
    return "No photo highlights in this plan yet.";
  }
  return message;
}

export function highlightTone(item: ItineraryItem, index: number): DestinationTone {
  if (item.activityType === "food" || item.activityType === "shopping") return "market";
  if (
    item.activityType === "attraction" ||
    item.activityType === "experience"
  ) {
    return index % 2 === 0 ? "harbor" : "city";
  }
  return index % 3 === 0 ? "coast" : "city";
}

export function getCountdownBadge(
  startDateStr: string,
  endDateStr: string,
  locale: Locale,
): { text: string; type: "incoming" | "active" | "completed" } {
  const now = new Date();
  const start = new Date(`${startDateStr}T00:00:00.000Z`);
  const end = new Date(`${endDateStr}T00:00:00.000Z`);

  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const todayMs = today.getTime();
  const startMs = start.getTime();
  const endMs = end.getTime();

  if (todayMs < startMs) {
    const diffDays = Math.ceil((startMs - todayMs) / (1000 * 60 * 60 * 24));
    return {
      text: locale === "th" ? `จะเริ่มในอีก ${diffDays} วัน` : `Starts in ${diffDays} days`,
      type: "incoming",
    };
  }

  if (todayMs >= startMs && todayMs <= endMs) {
    const diffDays = Math.floor((todayMs - startMs) / (1000 * 60 * 60 * 24)) + 1;
    const totalDays = Math.floor((endMs - startMs) / (1000 * 60 * 60 * 24)) + 1;
    return {
      text: locale === "th" ? `วันที่ ${diffDays} จาก ${totalDays}` : `Day ${diffDays} of ${totalDays}`,
      type: "active",
    };
  }

  return {
    text: locale === "th" ? "ทริปเสร็จสิ้นแล้ว" : "Trip Completed",
    type: "completed",
  };
}

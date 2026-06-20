import type { ItineraryItem } from "@/src/trip/types";
import type { DestinationTone } from "./overview-visuals";

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

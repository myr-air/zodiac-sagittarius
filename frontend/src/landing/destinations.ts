export type Destination = {
  name: string;
  seed: string;
  imageUrl: string;
};

export const POPULAR_DESTINATIONS: Destination[] = [
  {
    name: "Dubai",
    seed: "Dubai",
    imageUrl:
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Vietnam",
    seed: "Vietnam",
    imageUrl:
      "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Japan",
    seed: "Japan",
    imageUrl:
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Switzerland",
    seed: "Switzerland",
    imageUrl:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=80",
  },
];

export type TripIdea = {
  title: string;
  places: string;
  dates: string;
  imageUrl: string;
  avatarUrl: string;
};

export const TRIP_IDEAS: TripIdea[] = [
  {
    title: "Summer trip to Vietnam",
    places: "Vietnam · 8 places",
    dates: "Apr 1 – 15 · 15 days",
    imageUrl:
      "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80",
    avatarUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
  },
  {
    title: "Tokyo spring with the crew",
    places: "Japan · 12 places",
    dates: "Mar 20 – 30 · 11 days",
    imageUrl:
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80",
    avatarUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
  },
  {
    title: "Venice long weekend",
    places: "Italy · 5 places",
    dates: "May 8 – 11 · 4 days",
    imageUrl:
      "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=800&q=80",
    avatarUrl:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80",
  },
  {
    title: "Paris food walk",
    places: "France · 9 places",
    dates: "Jun 2 – 9 · 8 days",
    imageUrl:
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80",
    avatarUrl:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80",
  },
];

export type PlanningTip = {
  title: string;
  body: string;
  imageUrl: string;
};

export const PLANNING_TIPS: PlanningTip[] = [
  {
    title: "One itinerary, everyone aligned",
    body: "Shared days, activities, and decisions in a single plan desk.",
    imageUrl:
      "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Members and roles",
    body: "Organizers plan; travelers review; viewers stay in the loop.",
    imageUrl:
      "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Money stays plan-scoped",
    body: "Estimates and expenses follow the trip plan — not a separate spreadsheet.",
    imageUrl:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=80",
  },
];

export const HERO_IMAGE_URL =
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2400&q=80";

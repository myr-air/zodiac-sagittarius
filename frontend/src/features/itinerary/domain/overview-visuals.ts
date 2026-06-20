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
